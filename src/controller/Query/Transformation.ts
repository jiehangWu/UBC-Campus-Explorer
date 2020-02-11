export default class Transformation {
    public GROUP: string[];
    public APPLY: string;
    public value: string;

    public constructor(transObj: any) {

        this.GROUP = transObj["GROUP"];
        this.APPLY = transObj["APPLY"];
    }
}
