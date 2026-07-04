import { strategicActionsApi } from "@/api/client";
import { useQuery } from "@tanstack/react-query";

import { Users, UserCheck, ClipboardList, TrendingUp } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import EngagementChart from "@/components/dashboard/EngagementChart";
import DemandsChart from "@/components/dashboard/DemandsChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import TopLeaders from "@/components/dashboard/TopLeaders";
import { Skeleton } from "@/components/ui/skeleton";
import * as demandsApi from '@/api/demands';
import * as leadersApi from '@/api/leaders';
import * as contactsApi from '@/api/contacts';
import { normalizeList } from "@/lib/normalizeList";
export default function Dashboard() {
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactsApi.listContacts({ sort: "-created_at", limit: 1000 }),
  });

  const { data: leaders = [], isLoading: loadingLeaders } = useQuery({
    queryKey: ["leaders"],
    queryFn: () => leadersApi.listLeaders({ sort: "-supporters_count", limit: 100 }),
  });

  const { data: demands = [], isLoading: loadingDemands } = useQuery({
    queryKey: ["demands"],
    queryFn: () => demandsApi.listDemands({ sort: "-created_at", limit: 500 }),
  });

  const { data: actions = [], isLoading: loadingActions } = useQuery({
    queryKey: ["actions"],
    queryFn: () => strategicActionsApi.list({ sort: "-created_at", limit: 100 }),
  });

  const isLoading = loadingContacts || loadingLeaders || loadingDemands || loadingActions;

  // Calculate stats
  const totalContacts = normalizeList(contacts).length;
  const activeLeaders = normalizeList(leaders).filter(l => l.status === "ACTIVE" || l.status === "active").length;
  const openDemands = normalizeList(demands).filter(d => d.status === "OPEN" || d.status === "open" || d.status === "IN_PROGRESS" || d.status === "in_progress").length;
  const totalSupporters = normalizeList(leaders).reduce((sum, l) => sum + (l.supporters_count || 0), 0);

  // Demands by status
  const demandsByStatus = normalizeList(demands).reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  // Engagement by neighborhood
  const neighborhoodData = normalizeList(contacts).reduce((acc, c) => {
    if (c.neighborhood) {
      if (!acc[c.neighborhood]) {
        acc[c.neighborhood] = { contacts: 0, leaders: 0 };
      }
      acc[c.neighborhood].contacts++;
    }
    return acc;
  }, {});

  normalizeList(leaders).forEach(l => {
    if (l.neighborhood && neighborhoodData[l.neighborhood]) {
      neighborhoodData[l.neighborhood].leaders++;
    }
  });

  const chartData = Object.entries(neighborhoodData)
    .slice(0, 8)
    .map(([name, data]) => ({
      name: name.length > 12 ? name.substring(0, 12) + "..." : name,
      contacts: data.contacts,
      leaders: data.leaders,
    }));

  // Recent activities
  const recentActivities = [
    ...contacts.slice(0, 3).map(c => ({
      type: "contact",
      title: `Novo contato: ${c.full_name}`,
      description: c.neighborhood || c.city || "Sem localização",
      date: c.created_at,
    })),
    ...demands.slice(0, 3).map(d => ({
      type: "demand",
      title: d.title,
      description: `Status: ${d.status}`,
      date: d.created_at,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Visão geral da sua estratégia política
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Contatos"
          value={totalContacts.toLocaleString()}
          icon={Users}
          color="blue"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Lideranças Ativas"
          value={activeLeaders}
          icon={UserCheck}
          color="green"
          trend="up"
          trendValue="+5%"
        />
        <StatCard
          title="Demandas Abertas"
          value={openDemands}
          icon={ClipboardList}
          color="orange"
        />
        <StatCard
          title="Total de Apoiadores"
          value={totalSupporters.toLocaleString()}
          icon={TrendingUp}
          color="purple"
          trend="up"
          trendValue="+18%"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EngagementChart data={chartData} />
        <DemandsChart data={demandsByStatus} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={recentActivities} />
        <TopLeaders leaders={leaders} />
      </div>
    </div>
  );
}
