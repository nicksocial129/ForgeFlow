"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Interface_1 = require("../../../src/Interface");
const agents_1 = require("langchain/agents");
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
const chains_1 = require("langchain/chains");
const handler_1 = require("../../../src/handler");
class CSV_Agents {
    constructor() {
        this.label = 'CSV Agent';
        this.name = 'csvAgent';
        this.version = 1.0;
        this.type = 'AgentExecutor';
        this.category = 'Agents';
        this.icon = 'csvagent.png';
        this.description = 'Agent used to to answer queries on CSV data';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(agents_1.AgentExecutor)];
        this.inputs = [
            {
                label: 'Csv File',
                name: 'csvFile',
                type: 'file',
                fileType: '.csv'
            },
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'System Message',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                additionalParams: true,
                optional: true,
                placeholder: 'I want you to act as a document that I am having a conversation with. Your name is "AI Assistant". You will provide me with answers from the given info. If the answer is not included, say exactly "Hmm, I am not sure." and stop after that. Refuse to answer any question not about the info. Never break character.'
            }
        ];
    }
    async init() {
        // Not used
        return undefined;
    }
    async run(nodeData, input, options) {
        const csvFileBase64 = nodeData.inputs?.csvFile;
        const model = nodeData.inputs?.model;
        const systemMessagePrompt = nodeData.inputs?.systemMessagePrompt;
        const loggerHandler = new handler_1.ConsoleCallbackHandler(options.logger);
        const handler = new handler_1.CustomChainHandler(options.socketIO, options.socketIOClientId);
        const callbacks = await (0, handler_1.additionalCallbacks)(nodeData, options);
        let files = [];
        if (csvFileBase64.startsWith('[') && csvFileBase64.endsWith(']')) {
            files = JSON.parse(csvFileBase64);
        }
        else {
            files = [csvFileBase64];
        }
        let base64String = '';
        for (const file of files) {
            const splitDataURI = file.split(',');
            splitDataURI.pop();
            base64String = splitDataURI.pop() ?? '';
        }
        const pyodide = await (0, core_1.LoadPyodide)();
        // First load the csv file and get the dataframe dictionary of column types
        // For example using titanic.csv: {'PassengerId': 'int64', 'Survived': 'int64', 'Pclass': 'int64', 'Name': 'object', 'Sex': 'object', 'Age': 'float64', 'SibSp': 'int64', 'Parch': 'int64', 'Ticket': 'object', 'Fare': 'float64', 'Cabin': 'object', 'Embarked': 'object'}
        let dataframeColDict = '';
        try {
            const code = `import pandas as pd
import base64
from io import StringIO
import json

base64_string = "${base64String}"

decoded_data = base64.b64decode(base64_string)

csv_data = StringIO(decoded_data.decode('utf-8'))

df = pd.read_csv(csv_data)
my_dict = df.dtypes.astype(str).to_dict()
print(my_dict)
json.dumps(my_dict)`;
            dataframeColDict = await pyodide.runPythonAsync(code);
        }
        catch (error) {
            throw new Error(error);
        }
        // Then tell GPT to come out with ONLY python code
        // For example: len(df), df[df['SibSp'] > 3]['PassengerId'].count()
        let pythonCode = '';
        if (dataframeColDict) {
            const chain = new chains_1.LLMChain({
                llm: model,
                prompt: Interface_1.PromptTemplate.fromTemplate(core_1.systemPrompt),
                verbose: process.env.DEBUG === 'true' ? true : false
            });
            const inputs = {
                dict: dataframeColDict,
                question: input
            };
            const res = await chain.call(inputs, [loggerHandler, ...callbacks]);
            pythonCode = res?.text;
        }
        // Then run the code using Pyodide
        let finalResult = '';
        if (pythonCode) {
            try {
                const code = `import pandas as pd\n${pythonCode}`;
                finalResult = await pyodide.runPythonAsync(code);
            }
            catch (error) {
                throw new Error(`Sorry, I'm unable to find answer for question: "${input}" using following code: "${pythonCode}"`);
            }
        }
        // Finally, return a complete answer
        if (finalResult) {
            const chain = new chains_1.LLMChain({
                llm: model,
                prompt: Interface_1.PromptTemplate.fromTemplate(systemMessagePrompt ? `${systemMessagePrompt}\n${core_1.finalSystemPrompt}` : core_1.finalSystemPrompt),
                verbose: process.env.DEBUG === 'true' ? true : false
            });
            const inputs = {
                question: input,
                answer: finalResult
            };
            if (options.socketIO && options.socketIOClientId) {
                const result = await chain.call(inputs, [loggerHandler, handler, ...callbacks]);
                return result?.text;
            }
            else {
                const result = await chain.call(inputs, [loggerHandler, ...callbacks]);
                return result?.text;
            }
        }
        return pythonCode;
    }
}
module.exports = { nodeClass: CSV_Agents };
//# sourceMappingURL=CSVAgent.js.map