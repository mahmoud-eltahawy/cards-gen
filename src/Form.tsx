import { Accessor, createMemo, createResource, createSignal, For, Setter, Suspense } from "solid-js";
import { effect } from "solid-js/web";
import { commands, PathExisting } from "./tauri_bindings";
import { open } from '@tauri-apps/plugin-dialog';


function Form() {
  let [read_title,set_title] = createSignal("")
  let [read_path,set_path] = createSignal<string | null>(null)

  return (
      <dl class="border-sky-500 border-5 rounded-xl p-2 m-2 text-xl text-center">
          <CardTitle read_title={read_title} set_title={set_title}/>
          <XlsxPath read_path={read_path} set_path={set_path}/>
      </dl>
  );
}
          // <SheetName sheetname path/>
          // <TitleRowIndex path sheetname=sheetname index=title_row_index/>
          // <ColumnsIndexs indexs=columns_indexs sheetname=sheetname path headers_index=title_row_index/>
          // <button
          //     disabled=disabled
          //     on:click=on_submit
          //     class="text-3xl font-bold border-2 rounded-xl p-4 hover:cursor-pointer disabled:cursor-wait"
          //     style=submit_style
          // >{submit_title}</button>

type CardTitleProps = {
  read_title: Accessor<string>,
  set_title : Setter<string>  
};

function CardTitle(props :  CardTitleProps)  {
    let style = () =>  {
        if (props.read_title().length === 0){
            return "color:red;"
        } else {
            return ""
        }
    };

    return (
      <>
        <dd class="text-2xl m-2 p-2 font-bold border-l-2 border-r-2 rounded-xl">عنوان الكارت</dd>
        <dt>
            <input
                type="text"
                style={style()}
                class="border-2 w-3/6 rounded-lg p-2 text-center"
                on:input={(ev) => {
                    let value =ev.target.value;
                    props.set_title(value.trim());
                }}
            />
        </dt>
      </>
    )
}


async function path_autocomplete(path: PathExisting){
  let xs = await commands.pathAutocomplete(path)
  if (xs.status === "ok") {
    return xs.data
  } else {
    console.error(xs.error)
    return []    
  }
}

type XlsxPathProps = {
  read_path: Accessor<string | null>,
  set_path : Setter<string | null>  
};


function XlsxPath(props :  XlsxPathProps) {
    let [input_path,set_input_path] = createSignal("");
    let [read_style,set_style] = createSignal("");

    let [input_path_exists] = createResource(input_path,commands.pathExists);
    let path_exists = createMemo(() => input_path_exists())

    let [autocomplete_paths] = createResource(path_exists,path_autocomplete);

    effect(() => {
        let is_excel = ["xls", "xlsx", "xlsb", "ods"]
          .map((x) => input_path().endsWith(x)) 
          .includes(true)

        if (!is_excel) {
          set_style("color:red;");
          console.log("path is not excel")
          return;
        }

        let exists = input_path_exists();
        if (!exists) {
          set_style("color:red;");
          console.log("path does not exist")
          return;
        }

        if (exists.exists || exists.parent_exists) {
          props.set_path(input_path)
          set_style("")
        } else {
          set_style("color:red;");
        }
    });

    const choose = async () => {
        const file = await open({
          multiple: false,
          directory: false,
        });
        if(file) {
          console.log(file)
          set_input_path(file)
        }
    };

    return (
      <>
        <dd class="text-2xl m-2 p-2 font-bold border-l-2 border-r-2 rounded-xl">موقع ملف الاكسل</dd>
        <dt>
            <input
                dir="ltr"
                type="text"
                class="border-2 w-5/6 rounded-lg p-3 text-center"
                list="paths"
                style={read_style()}
                value={input_path()}
                on:input={(ev) => {
                    let value =ev.target.value;
                    set_input_path(value);
                }}
            />
            <datalist id="paths">
                <Suspense>
                  <For
                      each={autocomplete_paths()}
                  >
                    {(item) => (
                        <option value={item}/>
                    )}
                  </For>
                </Suspense>
            </datalist>
        </dt>
        <button
          onclick={choose}
          class="m-3 p-2 border-2 rounded-lg hover:bg-lime-700 focus:bg-lime-800 hover:cursor-pointer"
        >
          choose excel file
        </button>
      </>
    )
}


export default Form;
