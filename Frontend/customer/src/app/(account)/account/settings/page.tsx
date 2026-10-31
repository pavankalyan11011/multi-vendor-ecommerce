export default function SettingsPage() {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-emporia-ink">
        Settings
      </h2>
      <p className="text-sm leading-relaxed text-emporia-muted">
        Preference controls will land after core commerce APIs. Security basics
        (session, logout, password rules) already run through Emporia auth.
      </p>
    </div>
  );
}
