import React, { useEffect, useState } from "react";
import HomePage from "./HomePage";
import LearnPage from "./LearnPage";
import TranslatePage from "./TranslatePage";

// Dependency-free hash router: #/learn, #/translate, or "" for home.
// If you already use react-router, drop this file and pass
// onNavigate={(p) => navigate(p === "home" ? "/" : `/${p}`)} to each page.
const PAGES = { home: HomePage, learn: LearnPage, translate: TranslatePage };

const pageFromHash = () => {
  const name = window.location.hash.replace(/^#\/?/, "");
  return PAGES[name] ? name : "home";
};

export default function App() {
  const [page, setPage] = useState(pageFromHash);

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (name) => {
    window.location.hash = name === "home" ? "" : `/${name}`;
    setPage(name);
    window.scrollTo({ top: 0 });
  };

  const Page = PAGES[page];
  return <Page onNavigate={navigate} />;
}
