import React from 'react';
import { useUserStore } from '../../stores/userStore';
import { UserMenu } from './UserMenu';
import { Logo } from './Logo';
import { SyncIndicator } from '../sync/SyncIndicator';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const currentUser = useUserStore(state => state.currentUser);

  if (!currentUser) return null;

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            <SyncIndicator />
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}