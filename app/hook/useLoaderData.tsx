import { useLoaderData as useLoaderDataReact } from "@remix-run/react";

export const useLoaderData = () => {
    const s = useLoaderDataReact();
    const settings = { ...(s ?? {}) } as any;
    Object.keys(settings).forEach((key) => {
        if (settings[key] === "true") {
            settings[key] = true;
        } else if (settings[key] === "false") {
            settings[key] = false;
        }
        if (settings[key] && settings[key][0] && (settings[key][0] == "{" || settings[key][0] == "[")) {
            try {
                const d = JSON.parse(settings[key]);
                settings[key] = d
            } catch (error) {

            }
        }
    });
    return settings;
};
