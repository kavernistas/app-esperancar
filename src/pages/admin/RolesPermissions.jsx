import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ALL_PERMISSIONS, ALL_ROLES, ROLE_PERMISSIONS } from "@/api/permissions";

export default function RolesPermissions() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Papéis & Permissões</h2>
      <p className="text-slate-500 text-sm">Matriz leitura de permissões por papel. ADMIN tem acesso completo.</p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permissão</TableHead>
              {ALL_ROLES.filter(r => r !== "USER").map(r => <TableHead key={r}>{r}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ALL_PERMISSIONS.map(perm => (
              <TableRow key={perm}>
                <TableCell className="text-xs font-mono">{perm}</TableCell>
                {ALL_ROLES.filter(r => r !== "USER").map(r => {
                  const has = ROLE_PERMISSIONS[r]?.includes(perm);
                  return <TableCell key={r}>{has ? <Badge className="bg-emerald-100 text-emerald-700">✓</Badge> : <span className="text-slate-300">—</span>}</TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}