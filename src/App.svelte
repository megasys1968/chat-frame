<svelte:options tag="chat-frame"/>

<script lang="ts">
  import { onMount } from 'svelte';

  interface MessageNode {
    text: string;
    link?: string;
  }

  interface ChatMessage {
    nodes?: MessageNode[];
    isSend?: boolean;
  }

  interface ScenarioNode {
    id?: string
    message: string;
    nodes?: ScenarioNode[];
  }

  const SCENARIO_ROOT_PATH = '';

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
  let scenarioMap: {[key: string]: MessageNode[]} = {};

  onMount(async () => {
    hostElement =  (topElement.parentNode as ShadowRoot).host;
    modifyCustomElementClass();

    if (scenariourl) {
      // 問合せカテゴリを取得
      const res = await fetch(scenariourl, { headers: { 'Content-Type': 'text/json' } });
      let scenario = await res.json();
      // 問合せカテゴリを表示用に変換
      convertScenario(scenario);
      // 最初のカテゴリ選択肢を表示
      onSelectScenarioNode(SCENARIO_ROOT_PATH);
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
    messages = [...messages, { nodes: [{ text: sendText}], isSend: true}]
    messages = [...messages, { nodes: [ { text: 'ごめん、わからないや。' } ]}];
  }

  function onKeyupEvent(event: KeyboardEvent): void {
    console.log(event);

    if (event.ctrlKey && (event.code === 'Enter')) {
      onSend();
    }
  }

  function convertScenario(scenario: ScenarioNode, parentPath: string = '') {

    let currentPath: string = null;
    // ルートのカテゴリ選択肢なら?
    if (((parentPath?.length ?? 0) === 0)
      && ((scenario.id?.length ?? 0) === 0)) {
      currentPath = SCENARIO_ROOT_PATH;
    } else {
      console.assert(0 < scenario.id.length, '子ノードはidあり', scenario)
      currentPath = `${parentPath}/${scenario.id}`;
    }

    let msgNodes: MessageNode[] = [];
    [...scenario.message.split(/(\{\{.+?\}\})/g)]
      .forEach(splitted => {

        let matchResult = splitted.match(/^\{\{(.+?)\}\}$/)
        if (matchResult) {
          let childId = matchResult[1];
          console.log(`childId:${childId}`);
          let childNodePath = `${currentPath}/${childId}`;
          msgNodes.push({ text: childId, link: childNodePath } );
        } else {
          msgNodes.push({ text: splitted });
        }
      })
    scenarioMap[currentPath] = msgNodes;
    scenario.nodes?.forEach(node => convertScenario(node, currentPath))
  }

  function onSelectScenarioNode(nodePath: string) {
    let scenarioNode = scenarioMap[nodePath];
    if (scenarioNode) {
      messages = [...messages, { nodes: scenarioNode}];
    } else {
      messages = [...messages, { nodes: [ { text: 'ごめん、わからないや。' } ]}];
    }
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
      {#each msg.nodes as msgNode}
        {#if msgNode.link}
          <a href={'#'} on:click={() => onSelectScenarioNode((msgNode).link)}>{@html msgNode.text}</a>
        {:else}
          {@html msgNode.text}
        {/if}
      {/each}
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
