/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { Layout } from "./components/Layout";
import { GlobalLoader } from "./components/GlobalLoader";
import { AppProvider, useUser } from "./store/AppContext";


import { Onboarding } from "./pages/Onboarding";
import { Login } from "./pages/Login";
import { SetupStep1 } from "./pages/SetupStep1";
import { SetupStep2 } from "./pages/SetupStep2";
import { SetupStep3 } from "./pages/SetupStep3";
import { Feed } from "./pages/Feed";
import { CreateConfession } from "./pages/CreateConfession";
import { WhomToConfess } from "./pages/WhomToConfess";
import { ChoosePath } from "./pages/ChoosePath";
import { Activity } from "./pages/Activity";
import { Profile } from "./pages/Profile";
import { Chat } from "./pages/Chat";
import { ChatList } from "./pages/ChatList";
import { Search } from "./pages/Search";

import { AdminModule } from "./admin/App";

function ProtectedRoute() {
  const user = useUser();
  const location = useLocation();

  if (location.pathname.startsWith("/admin")) {
    return <Outlet />;
  }

  if (!user?.isSetupComplete && location.pathname !== "/" && location.pathname !== "/login" && !location.pathname.startsWith("/setup")) {
    return <Navigate to="/" replace />;
  }

  if (user?.isSetupComplete && (location.pathname === "/" || location.pathname === "/login" || location.pathname.startsWith("/setup"))) {
    return <Navigate to="/feed" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <GlobalLoader />
        <Routes>
          <Route path="/admin/*" element={<AdminModule />} />

          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Onboarding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/setup/1" element={<SetupStep1 />} />
              <Route path="/setup/2" element={<SetupStep2 />} />
              <Route path="/setup/3" element={<SetupStep3 />} />
              <Route path="/feed" element={<Feed />} />

              <Route path="/create" element={<CreateConfession />} />
              <Route path="/whom-to-confess" element={<WhomToConfess />} />
              <Route path="/choose-path" element={<ChoosePath />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/discover" element={<Search />} />
              <Route path="/chats" element={<ChatList />} />
              <Route path="/chat" element={<ChatList />} />
              <Route path="/chat/:id" element={<Chat />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}



