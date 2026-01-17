import { createSignal } from "solid-js";
import { commands } from "./tauri_bindings";

function Form() {
  const [greetMsg, setGreetMsg] = createSignal("");
  const [name, setName] = createSignal("");


  return (
    <main>
      <h1>Welcome to Tauri + Solid</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await commands.greet(name());
          setGreetMsg(res)
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg()}</p>
      <a href="/display">test</a>
    </main>
  );
}


export default Form;
