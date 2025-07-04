import React, { useState, useEffect, useMemo } from 'react';

const commonSystemFonts = [
  'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 'Georgia',
  'Times New Roman', 'Courier New', 'Lucida Console', 'Impact', 'Comic Sans MS',
  'Palatino Linotype', 'Garamond', 'Book Antiqua', 'Arial Black', 'Franklin Gothic Medium',
  'Segoe UI', 'Roboto', 'Open Sans',
  'Noto Sans', 'Lato', 'Montserrat',
  'Calibri', 'Cambria', 'Consolas',
  'SF Pro Display', 'SF Pro Text',
  'Inter',
];

const windowsFontScriptContent = `# get-windows-fonts.ps1
# This script retrieves a list of all installed font names on a Windows system,
# including both system-wide and user-specific installations.
# It queries the Windows Registry, cleans up the names, and outputs them alphabetically.
# The output is also saved to a text file named 'installed_fonts.txt' in the same directory.

# Define the registry paths for system-wide and user-specific fonts.
$systemFontRegistryPath = "HKLM:\\\\SOFTWARE\\\\Microsoft\\\\Windows NT\\\\CurrentVersion\\\\Fonts"
$userFontRegistryPath = "HKCU:\\\\Software\\\\Microsoft\\\\Windows NT\\\\CurrentVersion\\\\Fonts"

# Initialize an empty array to store cleaned font names
$fontNames = @()

# --- Process System-Wide Fonts ---
Write-Host "\`nRetrieving system-wide fonts...\`n"
try {
    $systemFontProperties = Get-ItemProperty -LiteralPath $systemFontRegistryPath -ErrorAction Stop
    foreach ($prop in $systemFontProperties.PSObject.Properties) {
        $fontValue = $prop.Value
        
        # First, extract just the filename (without path or extension) if it's a full path
        if ($fontValue -match '^[A-Za-z]:\\\\\\\\') {
            $fontValue = [System.IO.Path]::GetFileNameWithoutExtension($fontValue)
        }

        # Clean up font name: remove suffixes like (TrueType), (OpenType), and common file extensions
        $cleanedFontName = $fontValue -replace '\\s+\\(TrueType\\)$', '' \`
                                     -replace '\\s+\\(OpenType\\)$', '' \`
                                     -replace '\\.(ttf|otf|fon|ttc|woff|woff2)$' \`
                                     -ireplace ' \\(.*\\)$'
        $fontNames += $cleanedFontName
    }
}
catch {
    Write-Warning "Could not access system-wide font registry path: $($_.Exception.Message)"
}


# --- Process User-Specific Fonts ---
Write-Host "\`nRetrieving user-specific fonts...\`n"
try {
    $userFontProperties = Get-ItemProperty -LiteralPath $userFontRegistryPath -ErrorAction Stop
    foreach ($prop in $userFontProperties.PSObject.Properties) {
        $fontValue = $prop.Value
        
        # First, extract just the filename (without path or extension) if it's a full path
        if ($fontValue -match '^[A-Za-z]:\\\\\\\\') {
            $fontValue = [System.IO.Path]::GetFileNameWithoutExtension($fontValue)
        }

        # Clean up font name: remove suffixes like (TrueType), (OpenType), and common file extensions
        $cleanedFontName = $fontValue -replace '\\s+\\(TrueType\\)$', '' \`
                                     -replace '\\s+\\(OpenType\\)$', '' \`
                                     -replace '\\.(ttf|otf|fon|ttc|woff|woff2)$' \`
                                     -ireplace ' \\(.*\\)$'
        $fontNames += $cleanedFontName
    }
}
catch {
    Write-Warning "Could not access user-specific font registry path: $($_.Exception.Message)"
}

# Sort the collected font names alphabetically and ensure uniqueness
$finalFontList = $fontNames | Sort-Object | Select-Object -Unique

# Output the list to the console
Write-Host "\`n--- Final Compiled Font List ---\`n"
$finalFontList

# Define the output file path in the same directory as the script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$outputFilePath = Join-Path -Path $scriptDir -ChildPath "installed_fonts.txt"

# Save the sorted, unique font names to the text file
# -Encoding UTF8 ensures broad compatibility for font names with special characters
try {
    $finalFontList | Set-Content -Path $outputFilePath -Encoding UTF8 -ErrorAction Stop
    Write-Host "\`nFont list saved to: $outputFilePath\`n"
}
catch {
    Write-Error "Failed to save font list to file: $($_.Exception.Message)"
}

Write-Host "\`nScript finished.\`n"
`;

const App = () => {
  const [customText, setCustomText] = useState('The quick brown fox jumps over the lazy dog.');
  const [userFontListInput, setUserFontListInput] = useState('');
  const [userProvidedFonts, setUserProvidedFonts] = useState([]);
  const [showPreviews, setShowPreviews] = useState(false);
  const [numColumns, setNumColumns] = useState(3);
  const [copiedMessage, setCopiedMessage] = useState('');

  const allAvailableFonts = useMemo(() => {
    const combined = [...commonSystemFonts, ...userProvidedFonts];
    return Array.from(new Set(combined)).sort();
  }, [userProvidedFonts]);

  useEffect(() => {
    if (userFontListInput) {
      const parsedFonts = userFontListInput
        .split(/[\n,]+/)
        .map(font => font.trim())
        .filter(font => font.length > 0);
      setUserProvidedFonts(parsedFonts);
    } else {
      setUserProvidedFonts([]);
    }
    setShowPreviews(false);
  }, [userFontListInput]);

  const handleTextChange = (event) => {
    setCustomText(event.target.value);
    setShowPreviews(false);
  };

  const handleUserFontListInputChange = (event) => {
    setUserFontListInput(event.target.value);
  };

  const handleGeneratePreviews = () => {
    setShowPreviews(true);
  };

  const handleNumColumnsChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 6) {
      setNumColumns(value);
      setShowPreviews(false); 
    } else if (event.target.value === '') {
      setNumColumns(''); 
    }
  };

  const handleDownloadScript = () => {
    const blob = new Blob([windowsFontScriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'get-windows-fonts.ps1';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyFontName = (fontName) => {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = fontName;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();

    try {
      document.execCommand('copy');
      setCopiedMessage(`'${fontName}' copied!`);
      setTimeout(() => setCopiedMessage(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopiedMessage('Failed to copy!');
      setTimeout(() => setCopiedMessage(''), 2000);
    } finally {
      document.body.removeChild(tempTextArea);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center font-inter text-center overflow-x-hidden">
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />

      <div className="w-full bg-white rounded-lg shadow-xl p-6 md:p-8 ">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800  text-center">
          Batch Font Previewer
        </h1>

        {/* Custom Text Input */}
        <div className="w-[40%] mx-auto">
          <label htmlFor="customText" className="block text-gray-700 text-lg font-medium mb-2">
            Your Custom Text:
          </label>
          <textarea
            id="customText"
            className="w-full p-3 border border-gray-300 rounded-md transition duration-200 ease-in-out resize-y min-h-[80px]"
            value={customText}
            onChange={handleTextChange}
            placeholder="Type your text here..."
            rows="3"
          ></textarea>
        </div>

        <div className='flex flex-row align-items-center justify-center p-4 rounded-md gap-4'>
          {/* Font List Retrieval Commands */}
          <div className=" bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              How to get your system font list:
            </h3>
            <p className="text-gray-700 mb-2">
              Open your system's terminal/command prompt and use one of the following methods:
            </p>

            <div className="mb-3">
              <p className="font-bold text-gray-800">Windows:</p>
              <p className="text-sm text-gray-700 mb-2">
                Click the button below to download the PowerShell script. 
                <br/>
                Save it as `get-windows-fonts.ps1` and run it in PowerShell.
              </p>
              <button
                onClick={handleDownloadScript}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition duration-200 ease-in-out"
              >
                Download Windows Font Script
              </button>
              <p className="text-xs text-gray-600 mt-1">
                (Example: `.\get-windows-fonts.ps1`)
              </p>
            </div>

            <div className="mb-3">
              <p className="font-bold text-gray-800">macOS / Linux (Terminal):</p>
              <pre className="bg-gray-100 p-2 rounded-md text-sm overflow-x-auto">
                <code className="text-blue-700">
                  fc-list : family | sort | uniq
                </code>
              </pre>
              <p className="text-xs text-gray-600 mt-1">
                (If `fc-list` is not found, you might need to install `fontconfig`.)
              </p>
            </div>

            <p className="text-gray-700 mt-3">
              Copy the output from the command/script and paste it into the text area below.
            </p>
          </div>

          {/* User Provided Font List Input */}
          <div className="">
            <label htmlFor="userFontList" className="block text-gray-700 text-lg font-medium mb-2">
              Paste Your System Font List Here (one per line or comma-separated):
            </label>
            <textarea
              id="userFontList"
              className="w-full p-3 border border-gray-300 rounded-md transition duration-200 ease-in-out resize-y min-h-[100px]"
              value={userFontListInput}
              onChange={handleUserFontListInputChange}
              placeholder="e.g.,
Arial
Times New Roman
MyCustomFont
Another Font, Yet Another"
              rows="5"
            ></textarea>
            <p className="text-sm text-gray-500 mt-2">
              The fonts you paste here will be used for the preview.
            </p>
          </div>
        </div>

        <div className='flex flex-row justify-center p-4 rounded-md gap-4'>

          {/* Generate Previews Button */}
          <div className="text-center my-auto">
            <button
              onClick={handleGeneratePreviews}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-lg hover:bg-blue-700 transition duration-200 ease-in-out transform hover:scale-105"
            >
              Generate Font Previews ({allAvailableFonts.length} fonts)
            </button>
          </div>

          {/* Column Selection Input */}
          <label htmlFor="numColumns" className="block text-gray-700 text-lg font-medium my-auto">
              Columns:
            </label>
            <input
              type="number"
              id="numColumns"
              className=" p-3 rounded-md border border-gray-300"
              value={numColumns}
              onChange={handleNumColumnsChange}
              min="1"
              max="6"
              placeholder="1-6"
            />
        </div>

        {/* Font Preview Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4 text-center">
            All Font Previews
          </h2>
          {copiedMessage && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in-out">
              {copiedMessage}
            </div>
          )}
          {showPreviews ? (
            allAvailableFonts.length > 0 ? (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))`,
                }}
              >
                {allAvailableFonts.map((font, index) => (
                  <div key={index} className="mb-4 p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                    <p
                      className="text-lg font-semibold text-gray-800 mb-2 cursor-pointer hover:underline"
                      onClick={() => handleCopyFontName(font)}
                      title="Click to copy font name"
                    >
                      Font: <span className="text-blue-700">{font}</span>
                    </p>
                    <div
                      className="text-gray-900 text-xl md:text-2xl lg:text-[80px] p-2 border border-gray-300 rounded-md min-h-[80px] md:min-h-[100px] lg:min-h-[120px] flex items-center justify-center text-center break-words pointer-events-none"
                      style={{ fontFamily: font }}
                    >
                      {customText || "Type something above to see it here!"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600">
                No fonts to display. Please paste your system font list above and click "Generate Font Previews".
              </p>
            )
          ) : (
            <p className="text-center text-gray-600">
              Click "Generate Font Previews" to see all fonts.
            </p>
          )}
          <p className="text-xs text-gray-500 mt-4 text-center">
            Note: If a font is not installed on your system, it will display in your browser's default fallback font.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
