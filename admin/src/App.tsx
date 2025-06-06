import React, { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SetupPage } from "@/pages/SetupPage";
import { createConnectTransport } from "@connectrpc/connect-web";
import { getSessionToken } from "@/auth";
import { ConfigProvider, useConfig } from "@/config";
import { Transport } from "@connectrpc/connect";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnalyticsProvider } from "@/analytics";
import { Toaster } from "sonner";
import * as Sentry from "@sentry/react";
import { TransportProvider } from "@connectrpc/connect-query";
import { IndexPage } from "@/pages/IndexPage";
import { Layout } from "@/components/Layout";
import { ViewSAMLConnectionPage } from "@/pages/ViewSAMLConnectionPage";
import { ViewSCIMDirectoryPage } from "@/pages/ViewSCIMDirectoryPage";
import { SetupSAMLConnectionPage } from "@/pages/SetupSAMLConnectionPage";
import { ViewSAMLFlowPage } from "@/pages/ViewSAMLFlowPage";
import { TestModePage } from "@/pages/TestModePage";

const queryClient = new QueryClient();

function useTransport(): Transport {
  const { API_URL } = useConfig();
  return createConnectTransport({
    baseUrl: API_URL,
    interceptors: [
      (next) => async (req) => {
        req.header.set("Authorization", `Bearer ${getSessionToken() ?? ""}`);
        return next(req);
      },
    ],
  });
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/test-mode" element={<TestModePage />} />
      <Route
        path="/saml/saml-connections/:samlConnectionId/setup/:subStepId?"
        element={<SetupSAMLConnectionPage />}
      />
      <Route path="" element={<Layout />}>
        <Route path="/" element={<IndexPage />} />
        <Route
          path="/saml/saml-connections/:samlConnectionId"
          element={<ViewSAMLConnectionPage />}
        />
        <Route
          path="/saml/saml-connections/:samlConnectionId/flows/:samlFlowId"
          element={<ViewSAMLFlowPage />}
        />
        <Route
          path="/scim/scim-directories/:scimDirectoryId"
          element={<ViewSCIMDirectoryPage />}
        />
      </Route>
    </Routes>
  );
}

function AppWithinConfig() {
  const { SENTRY_DSN, SENTRY_ENVIRONMENT } = useConfig();
  const transport = useTransport();

  useEffect(() => {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
        Sentry.httpClientIntegration(),
      ],
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 1.0,
    });
  }, [SENTRY_DSN, SENTRY_ENVIRONMENT]);

  return (
    <>
      <TransportProvider transport={transport}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </QueryClientProvider>
      </TransportProvider>
      <Toaster />
    </>
  );
}

export function App() {
  return (
    <ConfigProvider>
      <AnalyticsProvider>
        <AppWithinConfig />
      </AnalyticsProvider>
    </ConfigProvider>
  );
}
