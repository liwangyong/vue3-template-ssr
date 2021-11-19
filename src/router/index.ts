// router.js
import { createRouter } from "vue-router";
import Home from "../home.vue";

const routes = [{ path: "/", component: Home }];

export default function (history: any) {
  return createRouter({
    history,
    routes
  });
}
