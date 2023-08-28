function nfcToBin(data){
    const buf = [];
    const dataInit = data.split("\n").filter((x) => x.startsWith("Block "));
    for (const line of dataInit) {
        const block = line.split(":" )[1].split(" ").filter(x => x).map(x => parseInt(x, 16));
        buf.push(new Uint8Array(block));
    }
    return new Uint8Array(buf.reduce((acc, cur) => [...acc, ...cur], []));
};

const BIN_TO_NFC_CONSTS = {
    "4B": {
        UID: [0, 4],
        SAK: [5, 6],
        ATQA: [6, 8],
    },
    "7B": {
        UID: [0, 7],
        SAK: [7, 8],
        ATQA: [8, 10],
    },
};

class BinToNfc {
    constructor(type){
        this.consts = BIN_TO_NFC_CONSTS[type];
    }

    getUID(contents) {
        const block = [];
        for (let i = this.consts.UID[0]; i < this.consts.UID[1]; i++) {
            const byte = contents[i].toString(16);
            block.push(byte);
        }
        return block.join(" ");
    }

    getSAK(contents) {
        const block = [];
        for (let i = this.consts.SAK[0]; i < this.consts.SAK[1]; i++) {
            const sak = contents[i].toString(16);
            block.push(sak);
        }
        return block.join(" ");
    }

    getATQA(contents) {
        const block = [];
        for (let i = this.consts.ATQA[0]; i < this.consts.ATQA[1]; i++) {
            const atqa = contents[i].toString(16);
            block.push(atqa);
        }
        return block.join(" ");
    }

    _convert(contents) {
        const buffer = [];
        let blockCount = 0;
        let mfSize = 0;
        const block = [];
        for (let i = 0; i < contents.length; i++) {
            const byte = contents[i].toString(16);
            block.push(byte);

            if (block.length === 16) {
                buffer.push(`Block ${blockCount}: ${block.join(" ")}`)
                block = [];
                blockCount++;

                switch(blockCount) {
                    case 64:
                        mfSize = 1;
                        break;
                    case 128:
                        mfSize = 2;
                        break;
                    case 256:
                        mfSize = 4;
                        break;
                };
            }
        }
        return [buffer.join("\n"), blockCount, mfSize];
    }

    convert(contents) {
        const [conversion, blockCount, mfSize] = this._convert(contents);
        return `Filetype: Flipper NFC device
Version: 2
# Nfc device type can be UID, Mifare Ultralight, Mifare Classic, Bank card
Device type: Mifare Classic
# UID, ATQA and SAK are common for all formats
UID: ${this.getUID(contents)}
ATQA: ${this.getATQA(contents)}
SAK: ${this.getSAK(contents)}
# Mifare Classic specific data
Mifare Classic type: ${mfSize}K
Data format version: 2
# Mifare Classic Blocks, '??' means unknown data
${conversion}
`;
      }
}

export {
    nfcToBin,
    BinToNfc,
}