const fileInput = document.getElementById('fileInput');
const output = document.getElementById('output');

// Add event listener for file input
fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    output.textContent = 'Loading PDF...'; // Display loading message
    
    const fileReader = new FileReader();
    
    fileReader.onload = function() {
      const pdfData = new Uint8Array(this.result);
      
      // Load the PDF using pdf.js
      pdfjsLib.getDocument(pdfData).promise.then(function(pdf) {
        let textContent = '';
        const numPages = pdf.numPages;
        
        let pagesProcessed = 0;
        
        // Iterate over each page in the PDF and extract the text
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          pdf.getPage(pageNum).then(function(page) {
            page.getTextContent().then(function(text) {
              text.items.forEach(function(item) {
                textContent += item.str + ' '; // Collect the text
              });

              pagesProcessed++;

              // Once all pages are processed, display the text
              if (pagesProcessed === numPages) {
                output.textContent = textContent; // Show the extracted text
              }
            }).catch(function(error) {
              console.error('Error extracting text from page:', error);
              output.textContent = 'Error extracting text from page.';
            });
          }).catch(function(error) {
            console.error('Error getting page:', error);
            output.textContent = 'Error loading page.';
          });
        }
      }).catch(function(error) {
        console.error('Error loading PDF document:', error);
        output.textContent = 'Failed to parse PDF.';
      });
    };

    // Read the file as an ArrayBuffer
    fileReader.readAsArrayBuffer(file);
  } else {
    output.textContent = 'Please upload a valid PDF file.';
  }
});
