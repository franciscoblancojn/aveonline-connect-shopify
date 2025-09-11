export interface IFormAuth {
    active: boolean;
    user: string;
    password: string;
    id_font?: number;
    currentAgente?: string;
    agentes?: IFormAuthAgentes[];
    error?: string;
    message?: string;
}
export interface IFormAuthAgentes {
    id: number;
    nombre: string;
    identificacion: number;
    email: string;
    direccion: string;
    comentarios: string;
    comentario_direccion: string;
    telefono: string;
    idordenrecogida: number;
    idciudad: string;
    principal: string;
    nombrecontacto: string;
    tienevalorminimo: boolean;
}
