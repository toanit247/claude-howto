import type { AppData } from "../shared/routes";
import { Layout } from "./components/Layout";
import { ArticlePage, ArticlesPage, MaintenancePage, NotFoundPage, PrivacyPage } from "./pages/ContentPages";
import { AgentLoginPage, AgentPage, ContactPage, LookupPage } from "./pages/FormPages";
import { HomePage } from "./pages/HomePage";
import { ProductPage } from "./pages/ProductPage";
import { DestinationPage, ToursPage } from "./pages/ToursPage";

function Page({ data }: { data: AppData }) {
  const page = data.page;
  switch (page.page) {
    case "home":
      return <HomePage data={data} page={page} />;
    case "tours":
      return <ToursPage data={data} page={page} />;
    case "destination":
      return <DestinationPage data={data} page={page} />;
    case "product":
      return <ProductPage data={data} page={page} />;
    case "articles":
      return <ArticlesPage data={data} page={page} />;
    case "article":
      return <ArticlePage data={data} page={page} />;
    case "lookup":
      return <LookupPage />;
    case "contact":
      return <ContactPage data={data} page={page} />;
    case "agent-login":
      return <AgentLoginPage data={data} page={page} />;
    case "agent":
      return <AgentPage data={data} />;
    case "privacy":
      return <PrivacyPage data={data} />;
    case "not-found":
      return <NotFoundPage />;
    case "maintenance":
      return <MaintenancePage />;
  }
}

export function App({ data }: { data: AppData }) {
  return (
    <Layout data={data}>
      <Page data={data} />
    </Layout>
  );
}
