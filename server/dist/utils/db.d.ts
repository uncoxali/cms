export declare function isMySQL(): boolean;
export declare function getTables(): Promise<{
    name: string;
}[]>;
