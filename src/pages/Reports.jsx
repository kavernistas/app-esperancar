import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import * as electoralApi from '@/api/electoral';
import * as demandsApi from '@/api/demands';
import * as leadersApi from '@/api/leaders';
import * as contactsApi from '@/api/contacts';
import {
  BarChart3,
  Users,
  Vote,
  Target,
} from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactsApi.listContacts("-created_date", 1000),
  });

  const { data: leaders = [], isLoading: loadingLeaders } = useQuery({
    queryKey: ["leaders"],
    queryFn: () => leadersApi.listLeaders("-supporters_count", 200),
  });

  const { data: demands = [], isLoading: loadingDemands } = useQuery({
    queryKey: ["demands"],
    queryFn: () => demandsApi.listDemands("-created_date", 500),
  });

  const { data: electoralData = [], isLoading: loadingElectoral } = useQuery({
    queryKey: ["electoralData"],
    queryFn: () => electoralApi.listElectoralData("-votes", 500),
  });

  const { data: actions = [], isLoading: loadingActions } = useQuery({
    queryKey: ["actions"],
    queryFn: () => strategicActionsApi.list("-created_date", 200),
  });

  const isLoading = loadingContacts || loadingLeaders || loadingDemands || loadingElectoral || loadingActions;

  // Data processing
  const contactsByCity = contacts.reduce((acc, c) => {
    const city = c.city || "Não informado";
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});

  const contactsByCityChart = Object.entries(contactsByCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const demandsByType = demands.reduce((acc, d) => {
    const type = d.type || "other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const demandsByTypeChart = Object.entries(demandsByType).map(([name, value]) => ({
    name: typeLabels[name] || name,
    value,
  }));

  const demandsByStatus = demands.reduce((acc, d) => {
    const status = d.status || "open";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const demandsByStatusChart = Object.entries(demandsByStatus).map(([name, value]) => ({
    name: statusLabels[name] || name,
    value,
  }));

  const leadersByStrength = leaders.reduce((acc, l) => {
    const strength = l.political_strength || "medium";
    acc[strength] = (acc[strength] || 0) + 1;
    return acc;
  }, {});

  const leadersByStrengthChart = Object.entries(leadersByStrength).map(([name, value]) => ({
    name: strengthLabels[name] || name,
    value,
  }));

  const votesByNeighborhood = electoralData.reduce((acc, d) => {
    const neighborhood = d.neighborhood || "Não informado";
    acc[neighborhood] = (acc[neighborhood] || 0) + (d.votes || 0);
    return acc;
  }, {});

  const votesByNeighborhoodChart = Object.entries(votesByNeighborhood)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, votes]) => ({ name, votes }));

  const engagementDistribution = [
    { name: "0-25%", value: contacts.filter((c) => (c.engagement_level || 0) <= 25).length },
    { name: "26-50%", value: contacts.filter((c) => (c.engagement_level || 0) > 25 && (c.engagement_level || 0) <= 50).length },
    { name: "51-75%", value: contacts.filter((c) => (c.engagement_level || 0) > 50 && (c.engagement_level || 0) <= 75).length },
    { name: "76-100%", value: contacts.filter((c) => (c.engagement_level || 0) > 75).length },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-slate-500 mt-1">
            Análise completa dos dados da campanha
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Contatos</p>
                <p className="text-2xl font-bold">{contacts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Lideranças</p>
                <p className="text-2xl font-bold">{leaders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Demandas</p>
                <p className="text-2xl font-bold">{demands.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Vote className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Votos</p>
                <p className="text-2xl font-bold">
                  {electoralData.reduce((sum, d) => sum + (d.votes || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="demands">Demandas</TabsTrigger>
          <TabsTrigger value="electoral">Eleitoral</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contacts by City */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Contatos por Cidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contactsByCityChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Demands by Type */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Demandas por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demandsByTypeChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {demandsByTypeChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Leaders by Strength */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Lideranças por Força Política</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadersByStrengthChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Distribution */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Engajamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label
                      >
                        {engagementDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Contatos por Cidade (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contactsByCityChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, angle: -45, textAnchor: "end" }} height={80} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Engajamento por Faixa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={engagementDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demands" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Demandas por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demandsByStatusChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label
                      >
                        {demandsByStatusChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Demandas por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demandsByTypeChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, angle: -45, textAnchor: "end" }} height={80} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="electoral" className="space-y-6 mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Votos por Bairro (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={votesByNeighborhoodChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="votes" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const typeLabels = {
  health: "Saúde",
  education: "Educação",
  infrastructure: "Infraestrutura",
  security: "Segurança",
  social: "Assistência Social",
  employment: "Emprego",
  housing: "Habitação",
  transport: "Transporte",
  other: "Outros",
};

const statusLabels = {
  open: "Aberto",
  in_progress: "Em Andamento",
  pending: "Pendente",
  resolved: "Resolvido",
  cancelled: "Cancelado",
};

const strengthLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  very_high: "Muito Alta",
};