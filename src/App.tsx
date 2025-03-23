import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FormulaEditor from "./components/FormulaEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FormulaEditor />
  </QueryClientProvider>
);

export default App;
