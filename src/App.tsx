import {
  Refine,
  GitHubBanner,
  Authenticated,
} from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router";
import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { dataProvider } from "./provider mock/data";
//import { Login } from "./pages/login";
//import { Register } from "./pages/register";
//import { ForgotPassword } from "./pages/forgot-password";
//import { ErrorComponent } from "./components/refine-ui/layout/error-component";
import { Layout } from "./components/refine-ui/layout/layout";
//import { Header } from "./components/refine-ui/layout/header";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import "./App.css";
import Dashboard from "./pages/dashboard";
import {Home, BookOpen, GraduationCap} from "lucide-react";
import SubjectsList from "./pages/subjects/list";
import SubjectsCreate from "./pages/subjects/create";
import ClassesList from "./pages/classes/list";
import ClassesCreate from "./pages/classes/create";
import ClassesShow from "./pages/classes/show";
import ClassEdit from "./pages/classes/edit";
import SubjectEdit from "./pages/subjects/edit";
import AuthPage from "./pages/auth";
import { authProvider } from "./provider mock/auth";
import AdminUsers from "./pages/admin/users";
import MyClasses from "./pages/classes/my-classes";
import AdminDepartments from "./pages/admin/departments";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider}
              authProvider={authProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "QEbfBL-pvuSDs-3R4nKZ",
              }}
              resources={[
                {
                  name: 'dashboard', 
                  list: '/', 
                  meta: { label: 'Home', icon: <Home /> }
                },
                {
                  name: 'subjects',
                  list: '/subjects',
                  create: '/subjects/create',
                  edit: '/subjects/edit/:id',
                  meta: { label: 'Subjects', icon: <BookOpen /> }
                },
                {
                  name: 'classes',
                  list: '/classes',
                  create: '/classes/create',
                  edit: '/classes/edit/:id',
                  show: '/classes/show/:id',
                  meta: { label: 'Classes', icon: <GraduationCap /> }
                }
              ]}
            >
              <Routes>
                <Route path="login" element={<AuthPage mode="login" />} />
                <Route path="register" element={<AuthPage mode="register" />} />
                <Route element={
                  <Layout>
                    <Outlet />
                  </Layout>
                }>
                  <Route path="/" element={<Dashboard />} />
                  <Route element={
                    <Authenticated key="signed-in" fallback={<Navigate to="/login" replace />} loading={<p>Checking sign-in...</p>}>
                      <Outlet />
                    </Authenticated>
                  }>
                    <Route path="admin/users" element={<AdminUsers />} />
                    <Route path="admin/departments" element={<AdminDepartments />} />
                    <Route path="my-classes" element={<MyClasses />} />
                    <Route path="subjects/create" element={<SubjectsCreate />} />
                    <Route path="subjects/edit/:id" element={<SubjectEdit />} />
                    <Route path="classes/create" element={<ClassesCreate />} />
                    <Route path="classes/edit/:id" element={<ClassEdit />} />
                  </Route>
                  <Route path="subjects">
                    <Route index element={<SubjectsList />} />
                  </Route>

                  <Route path="classes">
                    <Route index element={<ClassesList />} />
                    <Route path="show/:id" element={<ClassesShow />} />
                  </Route>
                </Route>
              </Routes>
              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
