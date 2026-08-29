/**
 * Formerly gated premium content behind the paid subscription. The Crude Oracle
 * is now 100% free, so this component simply renders its children for everyone.
 * Kept (with the same props) so existing pages need no changes and gating could
 * be reintroduced in one place if the model ever changes.
 */
export default function PremiumGate({
  children,
}: {
  children: React.ReactNode;
  title?: string;
  preview?: React.ReactNode;
}) {
  return <>{children}</>;
}
