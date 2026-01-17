/* @refresh reload */
import { render } from "solid-js/web";
import {Route,Router} from "@solidjs/router"
import Form from "./Form";
import Display from "./Display";

render(() => {
    return (
      <Router>
        <Route path="/" component={Form}/>
        <Route path="/display" component={Display}/>
       </Router>
    ) ;
}, document.getElementById("root") as HTMLElement);
