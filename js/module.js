class Tokenizer {
    constructor() {
        this.encoderURL = 'https://raw.githubusercontent.com/qqxufo/GPT-Tokenizer/gh-pages/data/encoder.json';
        this.bpeFileURL = 'https://raw.githubusercontent.com/qqxufo/GPT-Tokenizer/gh-pages/data/vocab.bpe';
        this.pat = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
        this.cache = new Map;
        this.textEncoder = new TextEncoder("utf-8");
        this.textDecoder = new TextDecoder("utf-8");
    }

    async loadResources() {
        const [encoderResponse, bpeFileResponse] = await Promise.all([
            fetch(this.encoderURL),
            fetch(this.bpeFileURL),
        ]);

        const [encoder, bpe_file] = await Promise.all([
            encoderResponse.json(),
            bpeFileResponse.text(),
        ]);

        this.encoder = encoder;
        this.decoder = this.inverseDict(encoder);
        this.byte_encoder = this.bytesToUnicode();
        this.byte_decoder = this.inverseDict(this.byte_encoder);

        const lines = bpe_file.split('\n');
        const bpe_merges = lines.slice(1, -1).map(x => x.split(/\s+/).filter(e => e.trim().length > 0));
        this.bpe_ranks = this.dictZip(bpe_merges, this.range(0, bpe_merges.length));
    }

    range(x, y) {
        return Array.from({ length: y - x }, (_, i) => i + x);
    }

    ord(x) {
        return x.charCodeAt(0);
    }

    chr(x) {
        return String.fromCharCode(x);
    }

    inverseDict(d) {
        const result = {};
        Object.keys(d).forEach(x => { result[d[x]] = x });
        return result;
    }

    bytesToUnicode() {
        const bs = this.range(this.ord('!'), this.ord('~') + 1)
            .concat(this.range(this.ord('¡'), this.ord('¬') + 1), this.range(this.ord('®'), this.ord('ÿ') + 1));
        let cs = bs.slice();
        let n = 0;
        for (let b = 0; b < 2 ** 8; b++) {
            if (!bs.includes(b)) {
                bs.push(b);
                cs.push(2 ** 8 + n);
                n += 1;
            }
        }
        return this.dictZip(bs, cs.map(x => this.chr(x)));
    }

    getPairs(word) {
        const pairs = new Set();
        let prev_char = word[0];
        for (let i = 1; i < word.length; i++) {
            const char = word[i];
            pairs.add([prev_char, char]);
            prev_char = char;
        }
        return pairs;
    }

    encodeStr(str) {
        return Array.from(this.textEncoder.encode(str)).map(x => x.toString());
    }

    decodeStr(arr) {
        return this.textDecoder.decode(new Uint8Array(arr));
    }

    dictZip(x, y) {
        const result = {};
        x.forEach((_, i) => { result[x[i]] = y[i] });
        return result;
    }

    bpe(token) {
        if (this.cache.has(token)) {
            return this.cache.get(token);
        }
        let word = token.split('');
        let pairs = this.getPairs(word);

        if (!pairs.size) {
            return token;
        }

        while (true) {
            const minPairs = {};
            Array.from(pairs).forEach(pair => {
                const rank = this.bpe_ranks[pair];
                minPairs[(isNaN(rank) ? 10e10 : rank)] = pair;
            });

            const bigram = minPairs[Math.min(...Object.keys(minPairs).map(x => parseInt(x)))];

            if (!(bigram in this.bpe_ranks)) {
                break;
            }

            const [first, second] = bigram;
            let new_word = [];
            let i = 0;

            while (i < word.length) {
                const j = word.indexOf(first, i);
                if (j === -1) {
                    new_word = new_word.concat(word.slice(i));
                    break;
                }
                new_word = new_word.concat(word.slice(i, j));
                i = j;

                if (word[i] === first && i < word.length - 1 && word[i + 1] === second) {
                    new_word.push(first + second);
                    i += 2;
                } else {
                    new_word.push(word[i]);
                    i += 1;
                }
            }

            word = new_word;
            if (word.length === 1) {
                break;
            } else {
                pairs = this.getPairs(word);
            }
        }

        const result = word.join(' ');
        this.cache.set(token, result);
        return result;
    }

    encode(text) {
        const matches = Array.from(text.matchAll(this.pat)).map(x => x[0]);
        const bpe_tokens = matches.flatMap(token => {
            token = this.encodeStr(token).map(x => this.byte_encoder[x]).join('');
            return this.bpe(token).split(' ').map(x => this.encoder[x]);
        });
        return bpe_tokens;
    }

    decode(tokens) {
        let text = tokens.map(x => this.decoder[x]).join('');
        text = this.decodeStr(text.split('').map(x => this.byte_decoder[x]));
        return text;
    }

    countTokens(text) {
        return this.encode(text).length;
    }

    countCharacters(text) {
        return text.length;
    }
}

const tokenizer = new Tokenizer();
tokenizer.loadResources().then(() => {
    window.tokenizer = tokenizer;
});