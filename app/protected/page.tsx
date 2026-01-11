import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function UserData() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  return (
    <div>
      <p>User: {user ? user.email : 'Not logged in'}</p>
    </div>
  );
}

export default function Test() {
  return (
    <div>
      <p>Test page</p>
      <Suspense fallback={<p>Loading user...</p>}>
        <UserData />
      </Suspense>
    </div>
  );
}