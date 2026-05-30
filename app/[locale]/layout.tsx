import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import ClientProviders from "../ClientProviders";
import GlobalHeader from "../components/GlobalHeader";

export const metadata: Metadata = {
  title: "Moli Teaching Games",
  description: "Interactive teaching games for vocabulary learning",
};

export function generateStaticParams() {
  return ["en", "vi"].map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // locale param is available for use by child components via useParams()
  await params;

  return (
    <ClientProviders>
      <GlobalHeader />
      {children}
    </ClientProviders>
  );
}
