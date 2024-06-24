import { SequenceChopper } from "./sequencechopper";
import { Fasta, IFastaObj } from './node_modules/fastautil/bin/FastaUtil';

const input = document.getElementById("input") as HTMLTextAreaElement;
const output = document.getElementById("outputs") as HTMLUListElement;
const peptideLengthInput = document.getElementById("peptide-length") as HTMLInputElement;
const overlapInput = document.getElementById("overlap") as HTMLInputElement;

const peptideToolBar = document.createElement("div");
peptideToolBar.classList.add("peptide-tool-bar");
peptideToolBar.innerHTML = `
    <button class="download-fasta-button" title="Download peptides as FASTA file"><span class="material-symbols-outlined">download</span>
    <button class="copy-clipboard-button" title="Copy peptide sequences to clipboard""><span class="material-symbols-outlined">content_copy</span>
`;

function downloadPeptideFastaFileFactory(sequence: IFastaObj): () => void {
    return (function () {
        let text = "";
        let counter = 1;
        for (const peptide of sequenceChopperFactory(sequence.sequence)) {
            text += `>${sequence.name}:peptide_${counter++}\n${peptide}\n`;
        }

        const downloader = document.createElement("a");
        downloader.setAttribute("href", "data:text/plain;charset=ascii," + encodeURIComponent(text));
        downloader.setAttribute("download", sequence.name + '_peptides.fasta');
        downloader.style.display = "none";
        document.body.appendChild(downloader);

        downloader.click();

        document.body.removeChild(downloader);
    });
}

function writeToClipboardFactory(sequence: IFastaObj): () => void {
    return (function () {
        const text = [...sequenceChopperFactory(sequence.sequence)].join('\n');
        navigator.clipboard.writeText(text);
    })
}

function sequenceChopperFactory(sequence: string): SequenceChopper {
    const peptideLength = peptideLengthInput.valueAsNumber;
    const overlap = overlapInput.valueAsNumber;

    return new SequenceChopper(sequence, peptideLength, overlap);
}

function changeListener() {
    overlapInput.setAttribute("max", `${peptideLengthInput.valueAsNumber-1}`);

    const fastaProcessor = new Fasta();
    const fasta = input.value;
    if (fasta == "") {
        return;
    }
    const sequences = fastaProcessor.parse(fasta);
    const newPeptideDisplays: HTMLDivElement[] = [];
    for (const sequence of sequences) {
        const div: HTMLDivElement = document.createElement('div');
        div.classList.add('peptide-display');

        const toolBar = peptideToolBar.cloneNode(true) as HTMLElement;
        toolBar.querySelector(".download-fasta-button")?.addEventListener("click", downloadPeptideFastaFileFactory(sequence));
        toolBar.querySelector(".copy-clipboard-button")?.addEventListener("click", writeToClipboardFactory(sequence));
        div.appendChild(toolBar);

        const title = document.createElement('h2');
        title.innerText = sequence.name;
        div.appendChild(title);

        const ul: HTMLUListElement = document.createElement('ul');
        div.appendChild(ul);
        for (const peptide of sequenceChopperFactory(sequence.sequence)) {
            const li = document.createElement("li");
            li.innerText = peptide;
            ul.appendChild(li);
        }
        newPeptideDisplays.push(div);
    }
    output.replaceChildren(...newPeptideDisplays);
}

input.addEventListener("input", changeListener);
peptideLengthInput.addEventListener("change", changeListener);
overlapInput.addEventListener("change", changeListener);
changeListener();