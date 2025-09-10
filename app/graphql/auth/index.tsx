import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { AdminApiContextWithoutRest } from "node_modules/@shopify/shopify-app-remix/dist/ts/server/clients";
import { authenticate } from "../../shopify.server";
import { AveApi } from "aveonline";
import type { Session } from "@shopify/shopify-app-remix/server";
import { onAddAllWebhooks } from "app/webhook";
import { parseNumber } from "fenextjs";
import type { IFormAuth } from "app/components/form/auth/interface";

export interface onGetDataProps {
    admin: AdminApiContextWithoutRest;
    settings: Record<string, string>;
}

export interface onSaveDataProps extends ActionFunctionArgs {
    admin: AdminApiContextWithoutRest;
    session: Session;
}
export class GraphqlAuth {
    private KEY = "app_auth";

    onGetData = async ({ admin, settings = {} }: onGetDataProps) => {
        const respond = await admin.graphql(`
            query {
                currentAppInstallation {
                    id
                    metafields(first: 10, namespace: "${this.KEY}") {
                        edges {
                            node {
                                key
                                value
                            }
                        }
                    }
                }
            }
        `);

        const result = await respond.json();
        const metafields =
            result?.data?.currentAppInstallation?.metafields?.edges || [];
        metafields.forEach((edge: any) => {
            settings[edge.node.key] = edge.node.value;
        });

        return settings;
    };

    onSaveData = async ({ admin, request, session }: onSaveDataProps) => {
        try {
            const form = await request.formData();
            const active = form.get("active");
            const user = form.get("user");
            const password = form.get("password");
            const currentAgente = form.get("currentAgente");
            let id_font: number | string | undefined = `${form.get("id_font")}`;
            if (
                id_font == "" ||
                id_font == undefined ||
                id_font == `undefined` ||
                id_font == "-1"
            ) {
                id_font = undefined;
            } else {
                id_font = parseNumber(id_font);
            }
            const token = session.accessToken ?? "";
            const shop = session.shop;

            if (!user) {
                throw new Error("El usuario es requerido");
            }
            if (!password) {
                throw new Error("La contraseña es requerida");
            }
            console.log({
                user,
                password,
                shop,
                token,
                id_font,
                currentAgente,
            });

            const api = new AveApi({
                typeAuth: "authenticate2",
                user: user.toString(),
                password: password.toString(),
            });
            await api.onLoad();
            console.log({
                user: api?.user,
            });
            let agentes: IFormAuth["agentes"] = [];
            if (api?.user?.token) {
                const idempresa = api.user.idempresa;
                const token = api.user.token;
                const resultAgentes = await api.agents.get({
                    idempresa,
                    token,
                });
                agentes = resultAgentes?.agentes ?? [];
                if (currentAgente) {
                    console.table(agentes);
                    const resultWebHook = await onAddAllWebhooks({
                        token,
                        shop,
                    });
                    console.log({ resultWebHook });
                    const resultSaveToken = await api.shopify.onSaveToken({
                        idempresa: api.user.idempresa,
                        token: api.user.token,
                        "x-shopify-shop-domain": shop,
                        modify: id_font,
                        agentId: parseInt(`${currentAgente}`),
                    });
                    id_font = resultSaveToken?.data?.id;
                    console.log({ resultSaveToken });
                }
            }
            // 1. Obtener el ID de instalación de la app
            const respond = await admin.graphql(`
                query {
                    currentAppInstallation { id }
                }
            `);
            const result = await respond.json();
            const data = result?.data;

            const installId = data?.currentAppInstallation?.id;

            // 2. Guardar los metafields (usuario y contraseña)
            let _error = "-1";
            if (api?.user?.status == "error") {
                _error = api?.user?.message;
            }
            const r = await admin.graphql(
                `mutation setAppData($metafields: [MetafieldsSetInput!]!) {
                    metafieldsSet(metafields: $metafields) {
                        metafields { id namespace key value }
                        userErrors { field message }
                    }
                }`,
                {
                    variables: {
                        metafields: [
                            {
                                ownerId: installId,
                                namespace: this.KEY,
                                key: "error",
                                value: _error,
                                type: "single_line_text_field",
                            },
                            {
                                ownerId: installId,
                                namespace: this.KEY,
                                key: "active",
                                value: active ? "true" : "false",
                                type: "boolean",
                            },
                            {
                                ownerId: installId,
                                namespace: this.KEY,
                                key: "user",
                                value: user,
                                type: "single_line_text_field",
                            },
                            {
                                ownerId: installId,
                                namespace: this.KEY,
                                key: "password",
                                value: password,
                                type: "single_line_text_field",
                            },
                            {
                                ownerId: installId,
                                namespace: this.KEY,
                                key: "id_font",
                                value: `${id_font ?? "-1"}`,
                                type: "number_integer",
                            },
                            {
                                ownerId: installId,
                                namespace: this.KEY,
                                key: "currentAgente",
                                value: `${currentAgente == "" ? "-1" : (currentAgente ?? "-1")}`,
                                type: "single_line_text_field",
                            },
                            {
                                ownerId: installId,
                                namespace: this.KEY,
                                key: "agentes",
                                value: JSON.stringify(agentes ?? []),
                                type: "json",
                            },
                        ],
                    },
                },
            );
            const r2 = await r.json();
            console.log({ r: JSON.stringify(r2?.data) });

            return json({
                success: true,
                message: "Configuración guardada con éxito",
            });
        } catch (error: Error | any) {
            console.log({
                message: error?.message,
                stack: error?.stack,
                error,
            });

            return json(
                { success: false, message: error?.message },
                { status: 500 },
            );
        }
    };
    loader = async ({ request }: LoaderFunctionArgs) => {
        const { admin } = await authenticate.admin(request);

        const settings: Record<string, string> = {
            ...(await this.onGetData({ admin, settings: {} })),
        };

        return settings;
    };
    action = async ({ request, ...props }: ActionFunctionArgs) => {
        const { admin, session } = await authenticate.admin(request);
        return await this.onSaveData({ admin, request, session, ...props });
    };
}
