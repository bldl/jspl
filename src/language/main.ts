import { startLanguageServer } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { createJavaScriptPropositionalLaboratoryFormatServices } from './java-script-propositional-laboratory-format-module.js';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared } = createJavaScriptPropositionalLaboratoryFormatServices({ connection, ...NodeFileSystem });

// Start the language server with the shared services
startLanguageServer(shared);
