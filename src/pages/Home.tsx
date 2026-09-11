import { useAuth } from '../auth';
import { Button } from '../components/Button';
import { Card, CardSwitch, CardTitle } from '../components/Card';

export function Home() {
  const { user, signOut } = useAuth();

  return (
    <Card>
      <CardTitle>You&rsquo;re signed in</CardTitle>
      <CardSwitch>This page proves the session reaches the API.</CardSwitch>

      <dl className="mb-[22px] grid grid-cols-[84px_1fr] gap-x-3 gap-y-[9px] border-t border-paper-edge pt-[18px] text-sm">
        <dt className="text-[13px] text-graphite-soft">Name</dt>
        <dd className="text-ink [overflow-wrap:anywhere]">{user?.name}</dd>
        <dt className="text-[13px] text-graphite-soft">Email</dt>
        <dd className="text-ink [overflow-wrap:anywhere]">{user?.email}</dd>
        <dt className="text-[13px] text-graphite-soft">Role</dt>
        <dd className="text-ink [overflow-wrap:anywhere]">{user?.role}</dd>
      </dl>

      <Button variant="ghost" type="button" onClick={() => void signOut()}>
        Sign out
      </Button>
    </Card>
  );
}
