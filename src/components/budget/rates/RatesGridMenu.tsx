import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { ChevronUp, ChevronDown, Search as SearchIcon } from 'lucide-react';

interface RatesGridMenuProps {
  isOpen: boolean;
  onClose: () => void;
  budgetLang: 'fr' | 'en';
  isEditMode: boolean;
  onAddToBudget: (poste: any) => void;
}

// Nouvelle structure pour la cascade
interface TarifaireCascadeGrouped {
  name: string;
  nameFr: string;
  nameEn: string;
  pricingBases: {
    pricingBase: string;
    units: {
      unit: string;
      hourBases: {
        hourBase: string;
        row: any;
      }[];
    }[];
  }[];
}

function groupTarifaireCascade(csvRows: any[]): TarifaireCascadeGrouped[] {
  const byName: Record<string, any> = {};
  for (const row of csvRows) {
    const nameFr = row['Name FR'] || '';
    const nameEn = row['Name EN'] || '';
    const nameKey = nameFr + '|' + nameEn;
    if (!byName[nameKey]) {
      byName[nameKey] = {
        name: nameFr || nameEn,
        nameFr,
        nameEn,
        variants: [],
      };
    }
    byName[nameKey].variants.push({
      pricingBase: row['Pricing Base'],
      unit: row['Unit'],
      hourBase: row['Hour base'],
      row,
    });
  }
  return Object.values(byName).map((entry: any) => ({
    name: entry.name,
    nameFr: entry.nameFr,
    nameEn: entry.nameEn,
    pricingBases: Array.from(
      entry.variants.reduce((pbMap: Map<string, any[]>, v: any) => {
        if (!pbMap.has(v.pricingBase)) pbMap.set(v.pricingBase, []);
        pbMap.get(v.pricingBase)!.push(v);
        return pbMap;
      }, new Map<string, any[]>()).entries()
    ).map((entry) => {
      const [pricingBase, pbVariants] = entry as [string, any[]];
      return {
        pricingBase,
        units: Array.from(
          pbVariants.reduce((uMap: Map<string, any[]>, v: any) => {
            if (!uMap.has(v.unit)) uMap.set(v.unit, []);
            uMap.get(v.unit)!.push(v);
            return uMap;
          }, new Map<string, any[]>()).entries()
        ).map((entry2) => {
          const [unit, uVariants] = entry2 as [string, any[]];
          return {
            unit,
            hourBases: uVariants.map((v: any) => ({
              hourBase: v.hourBase,
              row: v.row,
            })),
          };
        }),
      };
    }),
  }));
}

export function RatesGridMenu({ isOpen, onClose, budgetLang, isEditMode, onAddToBudget }: RatesGridMenuProps) {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [showCat1, setShowCat1] = useState(true);
  const [showCat2, setShowCat2] = useState(true);
  const [showCat3, setShowCat3] = useState(true);
  const [filterCat1, setFilterCat1] = useState('');
  const [filterCat2, setFilterCat2] = useState('');
  const [filterCat3, setFilterCat3] = useState('');
  // Sélections locales pour chaque poste unique
  const [selections, setSelections] = useState<Record<string, {pricingBase: string, unit: string, hourBase: string}>>({});
  // Ajout : état pour la pricing base générale
  const [globalPricingBase, setGlobalPricingBase] = useState<string>('');
  // Nouveaux états pour l'UX
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');

  // Helper pour fallback à une ligne vide si besoin
  const emptyRow = { 'Categorie 1': '', 'Categorie 2': '', 'Categorie 3': '', 'Unit': '', 'Price': '' };

  useEffect(() => {
    if (isOpen) {
      fetch('/GRILLE_TARIFAIRE.csv')
        .then((response) => response.text())
        .then((csvText) => {
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              setCsvData(results.data as any[]);
              setHeaders(results.meta.fields || []);
            },
          });
        });
    }
  }, [isOpen]);

  // Extraire toutes les pricing base uniques du CSV (colonne 6), triées alpha
  const allPricingBases = Array.from(new Set(csvData.map(row => row['Pricing Base']).filter((v: string) => v && v.trim() !== ''))).sort((a, b) => a.localeCompare(b));

  // Cascade groupée
  const grouped = groupTarifaireCascade(csvData);

  // Par défaut, sélectionner la première pricing base alpha à l'ouverture
  useEffect(() => {
    if (isOpen && allPricingBases.length > 0) {
      setGlobalPricingBase(allPricingBases[0]);
    }
  }, [isOpen, allPricingBases.length]);

  // Filtrage catégories (à adapter si besoin)
  let filteredGrouped = grouped;
  // Filtrage par pricing base générale
  if (globalPricingBase) {
    filteredGrouped = filteredGrouped.filter(row =>
      row.pricingBases.some(pb => pb.pricingBase === globalPricingBase || !pb.pricingBase || pb.pricingBase.trim() === '')
    );
  }
  // Filtrage catégories additionnel si besoin
  filteredGrouped = filteredGrouped.filter(row =>
    (!filterCat1 || row.pricingBases.some(pb => pb.pricingBase === filterCat1)) &&
    (!filterCat2 || row.pricingBases.some(pb => pb.units.some(u => u.unit === filterCat2))) &&
    (!filterCat3 || row.pricingBases.some(pb => pb.units.some(u => u.hourBases.some(hb => hb.hourBase === filterCat3))))
  );

  // Gestion des sélections dépendantes
  const handleSelectionChange = (nameKey: string, field: 'pricingBase'|'unit'|'hourBase', value: string) => {
    setSelections(prev => {
      const prevSel = prev[nameKey] || {pricingBase: '', unit: '', hourBase: ''};
      let newSel = { ...prevSel, [field]: value };
      // Si on change pricingBase, reset unit et hourBase
      if (field === 'pricingBase') {
        newSel.unit = '';
        newSel.hourBase = '';
      } else if (field === 'unit') {
        newSel.hourBase = '';
      }
      return { ...prev, [nameKey]: newSel };
    });
  };

  // Helpers pour tri
  function handleSort(col: string) {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }
  function renderSortIcon(col: string) {
    if (sortCol !== col) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />;
  }
  function sortRows(a: any, b: any, col: string, dir: 'asc'|'desc', lang: 'fr'|'en') {
    if (!col) return 0;
    let va = '', vb = '';
    if (col === 'Categorie 1') { va = a.pricingBases[0]?.units[0]?.hourBases[0]?.row['Categorie 1'] || ''; vb = b.pricingBases[0]?.units[0]?.hourBases[0]?.row['Categorie 1'] || ''; }
    else if (col === 'Categorie 2') { va = a.pricingBases[0]?.units[0]?.hourBases[0]?.row['Categorie 2'] || ''; vb = b.pricingBases[0]?.units[0]?.hourBases[0]?.row['Categorie 2'] || ''; }
    else if (col === 'Categorie 3') { va = a.pricingBases[0]?.units[0]?.hourBases[0]?.row['Categorie 3'] || ''; vb = b.pricingBases[0]?.units[0]?.hourBases[0]?.row['Categorie 3'] || ''; }
    else if (col === 'poste') { va = lang === 'en' ? a.nameEn : a.nameFr; vb = lang === 'en' ? b.nameEn : b.nameFr; }
    else if (col === 'unit') { va = a.pricingBases[0]?.units[0]?.unit || ''; vb = b.pricingBases[0]?.units[0]?.unit || ''; }
    else if (col === 'price') {
      va = a.pricingBases[0]?.units[0]?.hourBases[0]?.row['Price'] || '';
      vb = b.pricingBases[0]?.units[0]?.hourBases[0]?.row['Price'] || '';
    }
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  }

  if (!isOpen) return null;

  // Calcul du nombre de résultats
  const resultCount = filteredGrouped.filter(post => {
    const name = budgetLang === 'en' ? post.nameEn : post.nameFr;
    return !search || name.toLowerCase().includes(search.toLowerCase());
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-6xl w-full max-h-[92vh] overflow-y-auto border border-gray-200 relative animate-slide-up">
        {/* Header sticky */}
        <div className="sticky top-0 z-20 bg-white/95 flex justify-between items-center pb-2 mb-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="inline-block bg-blue-100 text-blue-700 rounded-lg px-2 py-0.5 text-base font-semibold">Grille tarifaire</span>
            <span className="ml-2 text-xs font-medium text-gray-400">{resultCount} résultat{resultCount > 1 ? 's' : ''}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl font-bold rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors" aria-label="Fermer la grille tarifaire">
            ×
          </button>
        </div>
        {/* Barre d'outils ergonomique */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un poste, une catégorie..."
              className="pl-10 pr-3 py-2 border border-gray-200 rounded-full text-sm w-72 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              aria-label="Rechercher un poste"
            />
            <SearchIcon size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          <div className="flex gap-1">
            <button type="button" className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${showCat1 ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`} onClick={() => setShowCat1(v => !v)}>Catégorie 1</button>
            <button type="button" className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${showCat2 ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`} onClick={() => setShowCat2(v => !v)}>Catégorie 2</button>
            <button type="button" className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${showCat3 ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`} onClick={() => setShowCat3(v => !v)}>Catégorie 3</button>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <span className="font-medium text-sm">Pricing base :</span>
            <select
              value={globalPricingBase}
              onChange={e => setGlobalPricingBase(e.target.value)}
              className="border border-gray-200 rounded-full px-3 py-1 text-sm shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              aria-label="Sélectionner la pricing base"
            >
              {allPricingBases.map(pb => (
                <option key={pb} value={pb}>{pb}</option>
              ))}
            </select>
          </div>
          <button type="button" className="ml-auto px-3 py-1 rounded-full text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 transition" onClick={() => { setShowCat1(true); setShowCat2(true); setShowCat3(true); setSearch(''); setGlobalPricingBase(allPricingBases[0] || ''); }}>Réinitialiser</button>
        </div>
        {/* Tableau ergonomique et moderne */}
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm bg-white">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-white/95 shadow-sm">
              <tr>
                {showCat1 && <th className="border-b px-4 py-2 font-semibold text-gray-600 text-left cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort('Categorie 1')}>Catégorie 1 {renderSortIcon('Categorie 1')}</th>}
                {showCat2 && <th className="border-b px-4 py-2 font-semibold text-gray-600 text-left cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort('Categorie 2')}>Catégorie 2 {renderSortIcon('Categorie 2')}</th>}
                {showCat3 && <th className="border-b px-4 py-2 font-semibold text-gray-600 text-left cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort('Categorie 3')}>Catégorie 3 {renderSortIcon('Categorie 3')}</th>}
                <th className="border-b px-4 py-2 font-semibold text-gray-700 text-left cursor-pointer select-none whitespace-nowrap sticky left-0 bg-white z-20" onClick={() => handleSort('poste')}>Poste {renderSortIcon('poste')}</th>
                <th className="border-b px-4 py-2 font-semibold text-gray-600 text-left cursor-pointer select-none whitespace-nowrap">Pricing base</th>
                <th className="border-b px-4 py-2 font-semibold text-gray-600 text-left cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort('unit')}>Unité {renderSortIcon('unit')}</th>
                <th className="border-b px-4 py-2 font-semibold text-gray-600 text-left cursor-pointer select-none whitespace-nowrap">Hour base</th>
                <th className="border-b px-4 py-2 font-semibold text-gray-700 text-right cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort('price')}>Tarif {renderSortIcon('price')}</th>
                {headers.includes('Cost') && <th className="border-b px-4 py-2 font-semibold text-gray-700 text-right whitespace-nowrap">Coût</th>}
                {headers.includes('Description') && <th className="border-b px-4 py-2 font-semibold text-gray-500 text-left whitespace-nowrap">Description</th>}
              </tr>
            </thead>
            <tbody>
              {filteredGrouped
                .filter(post => {
                  const name = budgetLang === 'en' ? post.nameEn : post.nameFr;
                  return !search || name.toLowerCase().includes(search.toLowerCase());
                })
                .sort((a, b) => sortRows(a, b, sortCol, sortDir, budgetLang))
                .map((post) => {
                  const nameKey = post.nameFr + '|' + post.nameEn;
                  const sel = selections[nameKey] || {pricingBase: globalPricingBase, unit: '', hourBase: ''};
                  const selectedPB = post.pricingBases.find(pb => pb.pricingBase === globalPricingBase);
                  const units = selectedPB ? selectedPB.units.map(u => u.unit) : [];
                  const selectedUnit = sel.unit || units[0] || '';
                  const unitObj = selectedPB && selectedUnit ? selectedPB.units.find(u => u.unit === selectedUnit) : selectedPB?.units[0];
                  const hourBases = unitObj ? unitObj.hourBases.map(hb => hb.hourBase) : [];
                  const selectedHourBase = sel.hourBase || hourBases[0] || '';
                  let selectedRow: any = null;
                  if (unitObj) {
                    if (selectedHourBase) {
                      selectedRow = unitObj.hourBases.find(hb => hb.hourBase === selectedHourBase)?.row;
                    }
                    if (!selectedRow && unitObj.hourBases.length > 0) {
                      selectedRow = unitObj.hourBases[0].row;
                    }
                  }
                  return (
                    <tr
                      key={nameKey}
                      className={selectedRow ? "hover:bg-blue-50/80 transition cursor-pointer group" : "opacity-50 cursor-not-allowed"}
                      onClick={() => {
                        if (selectedRow) {
                          let allVariants: any[] = [];
                          if (selectedPB) {
                            allVariants = selectedPB.units.flatMap(u => u.hourBases.map(hb => hb.row));
                          }
                          onAddToBudget({ ...selectedRow, _variants: allVariants });
                          onClose();
                        }
                      }}
                      style={selectedRow ? {} : { pointerEvents: 'none' }}
                      tabIndex={selectedRow ? 0 : -1}
                      aria-disabled={!selectedRow}
                    >
                      {showCat1 && <td className="px-4 py-2 whitespace-nowrap text-gray-700 group-hover:font-semibold transition-all" title={selectedRow ? selectedRow['Categorie 1'] : ''}>{selectedRow ? selectedRow['Categorie 1'] : ''}</td>}
                      {showCat2 && <td className="px-4 py-2 whitespace-nowrap text-gray-700 group-hover:font-semibold transition-all" title={selectedRow ? selectedRow['Categorie 2'] : ''}>{selectedRow ? selectedRow['Categorie 2'] : ''}</td>}
                      {showCat3 && <td className="px-4 py-2 whitespace-nowrap text-gray-700 group-hover:font-semibold transition-all" title={selectedRow ? selectedRow['Categorie 3'] : ''}>{selectedRow ? selectedRow['Categorie 3'] : ''}</td>}
                      <td className="px-4 py-2 whitespace-nowrap font-semibold text-blue-900 group-hover:underline transition-all sticky left-0 bg-white z-10" title={budgetLang === 'en' ? post.nameEn : post.nameFr}>{budgetLang === 'en' ? post.nameEn : post.nameFr}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className="inline-block bg-blue-50 text-blue-700 rounded px-2 py-0.5 text-xs font-semibold" title={globalPricingBase}>{globalPricingBase}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <select
                          value={selectedUnit}
                          onChange={e => handleSelectionChange(nameKey, 'unit', e.target.value)}
                          className="w-24 rounded-full border border-gray-200 px-2 py-1 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                          onClick={e => e.stopPropagation()}
                        >
                          {units.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {hourBases.length > 1 ? (
                          <select
                            value={selectedHourBase}
                            onChange={e => handleSelectionChange(nameKey, 'hourBase', e.target.value)}
                            className="w-24 rounded-full border border-gray-200 px-2 py-1 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                            onClick={e => e.stopPropagation()}
                          >
                            {hourBases.map(hb => (
                              <option key={hb} value={hb}>{hb}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-block bg-gray-50 text-gray-700 rounded px-2 py-0.5 text-xs" title={selectedHourBase}>{selectedHourBase}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right font-bold text-blue-700 text-base" title={selectedRow ? selectedRow['Price'] : ''}>{selectedRow ? selectedRow['Price'] : ''}</td>
                      {headers.includes('Cost') && <td className="px-4 py-2 whitespace-nowrap text-right text-gray-700" title={selectedRow ? selectedRow['Cost'] : ''}>{selectedRow ? selectedRow['Cost'] : ''}</td>}
                      {headers.includes('Description') && <td className="px-4 py-2 whitespace-nowrap text-gray-500" title={selectedRow ? selectedRow['Description'] : ''}>{selectedRow ? selectedRow['Description'] : ''}</td>}
                    </tr>
                  );
                })}
              {/* Message aucun résultat */}
              {resultCount === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-400 text-lg font-medium">Aucun poste trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}