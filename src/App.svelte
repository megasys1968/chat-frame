<svelte:options tag="chat-frame"/>

<script lang="ts">
  import { onMount } from 'svelte';

  interface ChatMessage {
    text?: string;
    answer?: string;
    isSend?: boolean;
  }

  interface ScenarioNode {
    id?: string
    message: string;
    nodes?: ScenarioNode[];
  }

  export let title = 'チャットボット'
  export let opened = false;
  export let scenariourl: string;

  $: {
    opened = !!opened;
    modifyCustomElementClass();
  }

  let  messages: ChatMessage[];
  $: messages = [];

  let sendText: string;
  let hostElement: Element;
  let topElement: HTMLElement;
  let scenarioMap: {[key: string]: string} = {};

  onMount(async () => {
    hostElement =  (topElement.parentNode as ShadowRoot).host;
    modifyCustomElementClass();

    if (scenariourl) {
      console.log('シナリオ取得');
      const res = await fetch(scenariourl, { headers: { 'Content-Type': 'text/json' } });
      let scenario = await res.json();
      convertScenario(scenario);
      messages = [...messages, { text: scenarioMap['']}]
      console.log(JSON.stringify(messages));
    }
  });

  function modifyCustomElementClass() {
    if (hostElement) {
      hostElement.classList.remove(opened ? 'close' : 'open');
      hostElement.classList.add(opened ? 'open' : 'close');
    }
  }

  function onToggleOpen() {
    opened = !opened;
    modifyCustomElementClass();
  }

  function onSend() {
    console.log('送信');
    messages = [...messages, { text: sendText, isSend: true}]
  }

  function onKeyupEvent(event: KeyboardEvent): void {
    console.log(event);

    if (event.ctrlKey && (event.code === 'Enter')) {
      onSend();
    }
  }


  function convertScenario(scenario: ScenarioNode, parentPath: string = '') {

    let currentPath: string = null;
    if ((parentPath?.length ?? 0) === 0) {
      if ((scenario.id?.length ?? 0) === 0) {
        currentPath = '';
      } else {
        currentPath = `/${scenario.id}`;
      }
    } else {
      console.assert(0 < scenario.id.length, '子ノードはidあり', scenario)
      currentPath = `${parentPath}/${scenario.id}`;
    }

    [...scenario.message.matchAll(/\{\{(.+?)\}\}/g)]
      .forEach(match => {
        let childId = match[1];
        console.log(`childId:${childId}`);
        let childNodePath = `${currentPath}/${childId}`;
        scenario.message = scenario.message.replace(`{{${childId}}}`, `<a href="javascript:void(0);" onClick="onSelectScenarioNode('${childNodePath}')">${childId}</a>`)
      })

    scenarioMap[currentPath] = scenario.message;


    scenario.nodes?.forEach(node => convertScenario(node, currentPath))
  }

  // TODO 要改善
  window.onSelectScenarioNode = function(nodePath: string) {
    messages = [...messages, { text: scenarioMap[nodePath]}]
  }

</script>

<div bind:this={topElement} />

<div part="header">
  <div part="title">{title}</div>
  <button on:click={onToggleOpen} part="toggle">
  </button>
</div>

<div part="body">
  {#each messages as msg}
    <div part={msg.isSend ? "receive-message" : "send-message"}>
      {@html msg.text}
    </div>
  {/each}
</div>

<div part="footer">
  <input type="text" part="query-text"
    placeholder="こちらに入力してください。"
    bind:value={sendText}
    on:keyup={onKeyupEvent}>

  <button type="button" part="query-button" on:click={onSend}>送信</button>
</div>
