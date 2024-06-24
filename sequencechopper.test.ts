import { SequenceChopper } from './sequencechopper';
import * as fs from 'fs';

function arrayEquality(a: Array<string>, b: Array<string>): boolean {
    if (a.length != b.length) {
        return false;
    }
    return a.every((value, index) => value === b[index]);
}

test('Check correct peptideLength without overlaps', () => {
    const abc = "ACDEFGHIKLMNPQRSTVWYXBZJ"
    for (let n=1; n < abc.length; n++) {
        const sequence = abc.slice(0, n); // n amino acids
        for (let pl=1; pl <= n; pl++) {
            const peptides = new Array(...(new SequenceChopper(sequence, pl, 0, "")));
            expect(peptides).toHaveLength(Math.ceil(n/pl));
            expect(peptides[peptides.length-1]).toHaveLength(pl);
        }
    }
});

test('Check correct overlaps', () => {
    const abc = "ACDEFGHIKLMNPQRSTVWYXBZJ";
    const truth = ['ACDEFGHIKL', 'HIKLMNPQRS', 'PQRSTVWYXB', 'RSTVWYXBZJ']
    const peptides = [...(new SequenceChopper(abc, 10, 4, ""))];
    expect(arrayEquality(peptides, truth)).toBe(true);
});

test('Check generated peptipdes on known sequence', () => {
    const sequence = fs.readFileSync('wt_test_sequence.txt', 'ascii');
    const peptides = fs.readFileSync('wt_test_peptides.txt', 'ascii').split('\n');

    const generatedPeptides = (new SequenceChopper(sequence))[Symbol.iterator]();
    for (let i = 0; i < peptides.length; i++) {
        const a = peptides[i];
        const b = generatedPeptides.next().value;
        console.log(a, b);
        expect(a).toBe(b);
    }

    //expect(arrayEquality(peptides, generatedPeptides));
});
