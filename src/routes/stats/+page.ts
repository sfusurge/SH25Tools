import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (loadEvent) => {
    if (loadEvent.url.searchParams.get("password") !== "surgeadmin") {
        return redirect(307, "/")
    }
};