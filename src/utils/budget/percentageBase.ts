import { BudgetCategory, BudgetLine } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { CurrencyCode } from '../../types/currency';
import { calculateLineTotalWithCurrency, calculateSocialCharges } from '../budgetCalculations/base';

export interface PercentageBaseResult {
  total: number;
  details: {
    id: string;
    name: string;
    type: 'category' | 'subCategory' | 'post' | 'subPost';
    amount: number;
    children?: PercentageBaseResult['details'];
  }[];
}

export function computePercentageBase(
  selectedIds: string[] = [],
  categories: BudgetCategory[],
  settings: QuoteSettings,
  convertAmount: (amount: number, fromCurrency?: CurrencyCode, toCurrency?: CurrencyCode) => number,
  selectedCurrency: CurrencyCode,
  includeSocialCharges: boolean = false,
  showRawDetails: boolean = false
): PercentageBaseResult {
  const categoryMap = new Map<string, BudgetCategory>();
  const postMap = new Map<string, BudgetLine>();
  function indexAll(categories: BudgetCategory[]) {
    for (const cat of categories) {
      categoryMap.set(cat.id, cat);
      if (cat.items) {
        for (const post of cat.items) {
          postMap.set(post.id, post);
          if (post.subItems && post.subItems.length > 0) {
            indexPosts(post.subItems);
          }
        }
      }
    }
  }
  function indexPosts(posts: BudgetLine[]) {
    for (const post of posts) {
      postMap.set(post.id, post);
      if (post.subItems && post.subItems.length > 0) {
        indexPosts(post.subItems);
      }
    }
  }
  indexAll(categories);

  const selectedSet = new Set(selectedIds);
  const alreadyIncluded = new Set<string>();

  function isParentSelected(post: BudgetLine, parentChain: string[]): boolean {
    return parentChain.some(parentId => selectedSet.has(parentId));
  }

  function sumCategory(cat: BudgetCategory): PercentageBaseResult['details'][0] {
    let total = 0;
    const children: PercentageBaseResult['details'] = [];
    if (cat.items) {
      for (const post of cat.items) {
        const res = showRawDetails ? sumPostRaw(post, [cat.id]) : sumPost(post, [cat.id]);
        total += res.amount;
        if (res.amount > 0) children.push(res);
      }
    }
    return {
      id: cat.id,
      name: cat.name,
      type: 'category',
      amount: total,
      children
    };
  }

  function sumSubCategory(subCat: BudgetLine, parentChain: string[]): PercentageBaseResult['details'][0] {
    let total = 0;
    const children: PercentageBaseResult['details'] = [];
    if (subCat.subItems) {
      for (const post of subCat.subItems) {
        const res = showRawDetails ? sumPostRaw(post, [...parentChain, subCat.id]) : sumPost(post, [...parentChain, subCat.id]);
        total += res.amount;
        if (res.amount > 0) children.push(res);
      }
    }
    return {
      id: subCat.id,
      name: subCat.name,
      type: 'subCategory',
      amount: total,
      children
    };
  }

  function sumPost(post: BudgetLine, parentChain: string[]): PercentageBaseResult['details'][0] {
    if (alreadyIncluded.has(post.id) || isParentSelected(post, parentChain)) {
      return { id: post.id, name: post.name, type: post.type, amount: 0 };
    }
    alreadyIncluded.add(post.id);
    if (post.type === 'subCategory' && selectedSet.has(post.id)) {
      return sumSubCategory(post, parentChain);
    }
    if ((post.type === 'post' || post.type === 'subPost') && selectedSet.has(post.id)) {
      let amount = calculateLineTotalWithCurrency(post, settings, convertAmount, selectedCurrency);
      if (includeSocialCharges && post.socialCharges) {
        amount += calculateSocialCharges(post, settings);
      }
      return { id: post.id, name: post.name, type: post.type, amount };
    }
    let total = 0;
    const children: PercentageBaseResult['details'] = [];
    if (post.subItems && post.subItems.length > 0) {
      for (const sub of post.subItems) {
        const res = sumPost(sub, [...parentChain, post.id]);
        total += res.amount;
        if (res.amount > 0) children.push(res);
      }
    }
    return { id: post.id, name: post.name, type: post.type, amount: total, children };
  }

  function sumPostRaw(post: BudgetLine, parentChain: string[]): PercentageBaseResult['details'][0] {
    let amount = 0;
    if (post.type === 'subCategory' && selectedSet.has(post.id)) {
      return sumSubCategory(post, parentChain);
    }
    if ((post.type === 'post' || post.type === 'subPost') && selectedSet.has(post.id)) {
      amount = calculateLineTotalWithCurrency(post, settings, convertAmount, selectedCurrency);
      if (includeSocialCharges && post.socialCharges) {
        amount += calculateSocialCharges(post, settings);
      }
      return { id: post.id, name: post.name, type: post.type, amount };
    }
    const children: PercentageBaseResult['details'] = [];
    if (post.subItems && post.subItems.length > 0) {
      for (const sub of post.subItems) {
        const res = sumPostRaw(sub, [...parentChain, post.id]);
        amount += res.amount;
        if (res.amount > 0) children.push(res);
      }
    }
    return { id: post.id, name: post.name, type: post.type, amount, children };
  }

  let total = 0;
  const details: PercentageBaseResult['details'] = [];
  for (const id of selectedIds) {
    if (categoryMap.has(id)) {
      const res = sumCategory(categoryMap.get(id)!);
      total += res.amount;
      details.push(res);
    } else if (postMap.has(id)) {
      const post = postMap.get(id)!;
      if (post.type === 'subCategory') {
        const res = sumSubCategory(post, []);
        total += res.amount;
        details.push(res);
      } else if (post.type === 'post' || post.type === 'subPost') {
        let amount = calculateLineTotalWithCurrency(post, settings, convertAmount, selectedCurrency);
        if (includeSocialCharges && post.socialCharges) {
          amount += calculateSocialCharges(post, settings);
        }
        details.push({ id: post.id, name: post.name, type: post.type, amount });
        total += amount;
      }
    }
  }
  return { total, details };
}

// Génère une clé plate et stable pour la structure de base d'un poste % (ids, noms, enfants, structure profonde)
export function getBaseStructureKey(selectedIds: string[], categories: BudgetCategory[]): string {
  const categoryMap = new Map<string, BudgetCategory>();
  const postMap = new Map<string, BudgetLine>();
  function indexAll(categories: BudgetCategory[]) {
    for (const cat of categories) {
      categoryMap.set(cat.id, cat);
      if (cat.items) {
        for (const post of cat.items) {
          postMap.set(post.id, post);
          if (post.subItems && post.subItems.length > 0) {
            indexPosts(post.subItems);
          }
        }
      }
    }
  }
  function indexPosts(posts: BudgetLine[]) {
    for (const post of posts) {
      postMap.set(post.id, post);
      if (post.subItems && post.subItems.length > 0) {
        indexPosts(post.subItems);
      }
    }
  }
  indexAll(categories);

  function serializePostDeep(post: BudgetLine): string {
    let base = `post:${post.id}:${post.name}:${post.type}`;
    if (post.subItems && post.subItems.length > 0) {
      base += '[' + post.subItems.map(serializePostDeep).join(',') + ']';
    }
    return base;
  }
  function serializeCatDeep(cat: BudgetCategory): string {
    let base = `cat:${cat.id}:${cat.name}`;
    if (cat.items && cat.items.length > 0) {
      base += '[' + cat.items.map(serializePostDeep).join(',') + ']';
    }
    return base;
  }

  return selectedIds.map(id => {
    if (categoryMap.has(id)) {
      return serializeCatDeep(categoryMap.get(id)!);
    } else if (postMap.has(id)) {
      return serializePostDeep(postMap.get(id)!);
    } else {
      return `unknown:${id}`;
    }
  }).join('|');
} 