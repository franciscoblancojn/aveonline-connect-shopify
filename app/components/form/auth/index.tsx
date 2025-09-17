import { BlockStack } from "@shopify/polaris";
import {
    Box,
    Button,
    ErrorComponent,
    InputPassword,
    InputSelectT,
    InputSwich,
    InputText,
    Title,
} from "fenextjs";
import type { useFormAuthProps } from "./hook";
import { useFormAuth } from "./hook";
import { useFetcher } from "@remix-run/react";
import type { IFormAuthAgentes } from "./interface";

export interface FormAuthProps extends useFormAuthProps {}

export const FormAuth = ({ ...props }: FormAuthProps) => {
    const fetcher = useFetcher();
    const { data, onChangeData, validatorData, dataError } = useFormAuth({
        ...props,
    });

    return (
        <>
            <fetcher.Form method="post">
                <BlockStack gap="200">
                    <Box>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: ".5rem",
                                cursor: "pointer",
                            }}
                        >
                            <InputSwich
                                name="active"
                                onChange={onChangeData("active")}
                                defaultValue={data.active}
                            />
                            <Title tag="h3">Activar</Title>
                        </label>
                    </Box>
                    <Box>
                        <BlockStack gap="200">
                            <Title tag="h3">Configuración</Title>

                            <input
                                name="id_font"
                                defaultValue={data.id_font}
                                hidden
                            />
                            <InputText
                                name="user"
                                label="Usuario"
                                placeholder="Usuario"
                                defaultValue={data.user}
                                validator={validatorData?.user}
                                onChange={onChangeData("user")}
                            />
                            <InputPassword
                                name="password"
                                label="Contraseña"
                                placeholder="Contraseña"
                                defaultValue={data.password}
                                validator={validatorData?.password}
                                onChange={onChangeData("password")}
                            />
                            {data?.agentes && data?.agentes?.length != 0 && (
                                <>
                                    <InputSelectT<IFormAuthAgentes>
                                        id="currentAgente"
                                        name="currentAgente"
                                        label="Agente"
                                        placeholder="Agente"
                                        typeSelect="select"
                                        defaultValue={(
                                            data?.agentes ?? []
                                        )?.find(
                                            (e) =>
                                                `${e.id}` == data.currentAgente,
                                        )}
                                        validator={validatorData?.currentAgente}
                                        options={data?.agentes ?? []}
                                        onParse={(e) => {
                                            return {
                                                id: e?.id ?? 0,

                                                text: e?.nombre ?? "",
                                                data: e,
                                            };
                                        }}
                                        classNameList="ave-select fenext-input-content-input"
                                        classNameContentInput="d-none"
                                        useIdForValue={true}
                                    />
                                </>
                            )}

                            {dataError && (
                                <ErrorComponent error={dataError?.error} />
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="hidden"
                                    name="_action"
                                    value="saveConfig"
                                />
                                <Button loader={fetcher.state == "submitting"}>
                                    Guardar configuración
                                </Button>
                            </div>
                            {/* Loader durante el submit */}
                            {fetcher.state === "submitting" && (
                                <p>Enviando...</p>
                            )}

                            {/* Mensajes después de la respuesta */}
                            {(fetcher.data as any)?.success && (
                                <p style={{ color: "green" }}>
                                    ✅ Guardado con éxito
                                </p>
                            )}
                            {(fetcher.data as any)?.success === false && (
                                <p style={{ color: "red" }}>
                                    ❌ {(fetcher.data as any).message}
                                </p>
                            )}
                            {JSON.stringify(fetcher.formData, null, 2)}
                        </BlockStack>
                    </Box>
                </BlockStack>
                <style>{`
                    .d-none.d-none{
                        display:none;
                    }
                    .ave-select.ave-select{
                        opacity: 1;
                        position: static;
                    }
                    .fenext-input-content-input.fenext-input-content-input {
                        width: 100%;
                        padding: 1rem 1.5rem;
                        opacity: 1;
                        border-radius: .7rem;
                        border: 0;
                        color: var(--fenext-color-dark);
                        background-color: var(--fenext-color-light);
                        font-family: var(--fenext-font-global);
                        box-shadow: var(--box-shadow);
                        font-size: 1rem;
                        font-weight: 800;
                        line-height: 1.36;
                        text-align: left;
                        outline: none;
                    }
                `}</style>
            </fetcher.Form>
        </>
    );
};
