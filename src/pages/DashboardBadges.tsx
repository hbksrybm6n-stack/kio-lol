import { useState, useEffect } from 'react';
import { badgesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Award, Lock } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export default function DashboardBadges() {
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const data = await badgesApi.getAll();
      setBadges(data);
    } catch (err) {
      console.error('Failed to load badges:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-neutral-800 rounded animate-pulse" />
        <div className="h-4 w-60 bg-neutral-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-neutral-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Badges</h1>
        <p className="text-neutral-400 mt-1">View and manage your profile badges.</p>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="text-neutral-400">
          <span className="text-white font-medium">{earnedCount}</span> / {badges.length} earned
        </span>
        <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${badges.length ? (earnedCount / badges.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <Card
            key={badge.id}
            className={cn(
              'p-4 transition-all',
              badge.earned
                ? 'border border-neutral-700'
                : 'border border-neutral-800 opacity-50'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                  badge.earned ? 'bg-neutral-800' : 'bg-neutral-800/50'
                )}
              >
                {badge.earned ? (
                  <Award size={24} className="text-white" />
                ) : (
                  <Lock size={24} className="text-neutral-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={cn('font-medium truncate', badge.earned ? 'text-white' : 'text-neutral-500')}>
                  {badge.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{badge.description}</p>
                {badge.earned && badge.earnedAt && (
                  <p className="text-xs text-neutral-600 mt-1">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {badges.length === 0 && (
        <Card className="p-12 text-center">
          <Award size={48} className="mx-auto text-neutral-700 mb-4" />
          <p className="text-neutral-400">No badges available yet.</p>
        </Card>
      )}
    </div>
  );
}