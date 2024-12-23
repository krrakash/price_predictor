import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import {SupportedChains} from "../alerts/alert.entity";

@Entity()
export class Price {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    chain: SupportedChains;

    @Column('decimal')
    price: number;

    @CreateDateColumn()
    timestamp: Date;
}

