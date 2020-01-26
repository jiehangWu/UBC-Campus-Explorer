import { MKey } from "./MKeyFieldPair";
import { SKey } from "./SKeyFieldPair";

export class MyOPTIONS {
    public Column: MKey[] | SKey[];
    public ORDER: MKey | SKey;
}
