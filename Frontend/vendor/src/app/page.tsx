import { MarketingHero } from "@/components/brand/MarketingHero";

export default function HomePage() {
  return (
    <MarketingHero
      primaryHref="/login"
      primaryLabel="Seller sign in"
      secondaryHref="/register"
      secondaryLabel="Become a seller"
    />
  );
}
