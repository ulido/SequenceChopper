// Interface to return position and peptide
interface PeptideElement {
    position: number;
    peptide: string;
}

/**
 * Class that takes a string composed of amino acid letters and chops it into peptide fragments of the specified length and overlap.
 */
export class SequenceChopper implements Iterable<string> {
    private disallowedEndsRE: RegExp;

    /**
     * 
     * @param sequence - A string containing the amino acid sequence.
     * Can only contain the letters ACDEFGHIKLMNPQRSTVWYXBZJ and needs to be at least one character long.
     *
     * @param peptideLength - Length of the peptides.
     * This is a guide only since the length of peptides can be shorter due to disallowed amino acids at the end.
     * 
     * @param overlap - Number of amino acids to overlap with the previous peptide.
     * 
     * @param disallowedEnds - Amino acids to disallow at the end of a new peptide (those will be removed from the end).
     * 
     * @param nrDisallowedEndAAs - Maximum number of disallowed amino acids to chop off the end of a new peptide.
     * If more than this number of disallowed amino acids are present, the full {@link peptideLength} peptide will be returned.
     * 
     */
    constructor(
        private sequence: string,
        private peptideLength: number = 18,
        private overlap: number = 10,
        disallowedEnds: string = "GSDENQHPCAT",
        nrDisallowedEndAAs: number = 3,
    ) {
        if (this.peptideLength < 1) {
            throw new Error('Peptide length needs to be >= 1!');
        }
        // Check if the given sequence is appropriate
        this.verifySequence();
        // Construct the regular expression to chop disallowed amino acids off the end of a new peptide
        this.disallowedEndsRE = new RegExp(`(?<![${disallowedEnds}])[${disallowedEnds}]{1,${nrDisallowedEndAAs}}$`);
    }

    // Verifty that the given AA sequence is valid.
    private verifySequence() {
        // Check that the given sequence is at least one peptide long
        if (this.sequence.length < this.peptideLength) {
            throw new Error('Sequence length is smaller than the specified peptide length!');
        }
        // Check that the given sequence only contains allowed amino acids
        const aaRe = /[ACDEFGHIKLMNPQRSTVWYXBZJ]+/
        if (!aaRe.test(this.sequence)) {
            throw new Error("Invalid amino acid sequence!");
        }
    }

    // Return the next peptide (and the next position) given the current position.
    private nextPeptide(position: number): PeptideElement {
        // Check that we're not at the end of the sequence
        if (position >= this.sequence.length) {
            return {position: this.sequence.length, peptide: ""};
            throw Error("Requesting peptide from beyond the sequence end!")
        }
        // The start of the new peptide should be the current position minus the given overlap between peptides.
        // The peptide cannot start earlier than the start of the sequence.
        let start = Math.max(position-this.overlap, 0);
        // The end of the new peptide needs to be the given peptide length beyond the start, but cannot be beyond the end of the sequence.
        const end = Math.min(start + this.peptideLength, this.sequence.length);
        // Check if the length of the proposed peptide is smaller than the given peptide length (because we're at the end of the sequence).
        if (end - start < this.peptideLength) {
            // Shift the start to the left (creating more overlap).
            start = end - this.peptideLength;
            // Check If the start is now to the left of the sequence start (this should never happen!)
            if (start < 0) {
                throw new Error('Cannot fit a new peptide into the sequence. This should not happen!');
            }
        }
        // Retrieve candidate sequence
        let candidate = this.sequence.slice(start, end);
        // Remove disallowed AAs from the end and return the new peptide
        return {
            position: end,
            peptide: candidate.replace(this.disallowedEndsRE, ''),
        };
    }

    [Symbol.iterator]() {
        // Initialise our new iterator at position zero
        let position: number = 0;
        // Ugly hack to be able to access parent object
        const self = this;
        // Current value
        let value: string = "";

        return {
            next(): IteratorResult<string> {
                let ret: IteratorResult<string>;
                const done = position >= self.sequence.length;
                if (!done) {
                    // Get new peptide sequence
                    const element = self.nextPeptide(position);
                    // Update the position of the iterator on the sequence
                    position = element.position;
                    // Save the last value since we need to return this if we're done at the next iteration
                    value = element.peptide;
                }
                return {
                    // This is the last peptide if the position has reached the end of the sequence
                    done: done,
                    // The current iterator value is the peptide
                    value: value,
                };
            }
        };
    }
}