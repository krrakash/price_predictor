import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from "typeorm";

export enum SupportedChains {
    Ethereum = '0x1',
    Polygon = '0x89',
}

@Entity()
export class Alert {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    chain: SupportedChains;

    @Column('decimal')
    dollar: number;

    @Column()
    email: string;

    @CreateDateColumn()
    createdAt: Date;
}