export interface Message {
    id: string;
    sender: {
        id: string;
        name: string;
        image?: string;
        role: string;
    };
    content: string;
    attachments?: any[];
    createdAt: string;
}

export interface Channel {
    id: string;
    name: string | null;
    description: string | null;
    type: 'PUBLIC' | 'PRIVATE' | 'DIRECT';
    isSpaceChannel?: boolean;
    isSystem?: boolean;
    members?: { id: string, name: string, image?: string, role: string }[];
    spaceId?: string;
}

export interface User {
    id: string;
    name: string;
    image?: string;
    role: string;
}
