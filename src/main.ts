import { default as App } from './App.svelte';
import './main.scss';

export default App;

declare global {
  interface Window {
    onSelectScenarioNode(nodePath: string)
  }
}
