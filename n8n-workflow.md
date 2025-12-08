{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "script-forge",
        "responseMode": "responseNode",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [
        -560,
        48
      ],
      "id": "32e919e2-95e0-4348-95e1-e5dc22bdd874",
      "name": "Webhook",
      "webhookId": "4acb4544-cc18-4353-8242-9a8d936058d0"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.body.source_type }}",
                    "rightValue": "youtube",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "4e64ca36-065d-419f-a647-44dd5fd6441f"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "YouTube"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "74d4d446-24c5-40d6-bfff-9727c9049edd",
                    "leftValue": "={{ $json.body.source_type }}",
                    "rightValue": "website",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Website"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "f7536ae2-7a1d-46a9-b490-08b9e2b45d7a",
                    "leftValue": "={{ $json.body.source_type }}",
                    "rightValue": "rss",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "RSS Feed"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.3,
      "position": [
        -336,
        32
      ],
      "id": "c394474d-a24f-4d48-8266-44dd08a89862",
      "name": "Switch"
    },
    {
      "parameters": {
        "jsCode": "// n8n Code: Extract videoId from webhook source_url\nconst items = $input.all();\nreturn items.map(item => {\n  const sourceUrl = item.json.body?.source_url || '';\n  \n  if (!sourceUrl) {\n    return { json: { error: 'No source_url in webhook' } };\n  }\n  \n  // Extract videoId (handles youtu.be, watch?v=, embed/)\n  let videoId = null;\n  const matches = sourceUrl.match(/(?:v=|youtu\\.be\\/|embed\\/)([^?&]+)/);\n  videoId = matches ? matches[1] : null;\n  \n  return {\n    json: {\n      ...item.json.body,  // Keep client_token, category, etc.\n      videoId,\n      success: !!videoId\n    }\n  };\n});\n"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -112,
        -144
      ],
      "id": "2f77ce58-260f-44c2-80be-c8941c00dbdc",
      "name": "Code in JavaScript"
    },
    {
      "parameters": {
        "url": "https://api.supadata.ai/v1/youtube/transcript",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "supadataApi",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "videoId",
              "value": "={{ $json.videoId }}"
            },
            {
              "name": "text",
              "value": "true"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.3,
      "position": [
        112,
        -144
      ],
      "id": "ae92bed5-5bc8-4496-a3b9-27d222d096cc",
      "name": "HTTP Request",
      "credentials": {
        "supadataApi": {
          "id": "vpzykoNtKqZG4r6k",
          "name": "Supadata account"
        }
      }
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "=## Here are the details for the script:\n- **Category:** {{ $json.category }}\n- **Tone:** {{ $json.tone }}\n- **Output Type:** {{ $json.output_type }}\n- **Content:** {{ $json.content }}\n- **Requirement:** {{ $json.requirements }}",
        "hasOutputParser": true,
        "options": {
          "systemMessage": "=# Overview\nYou are an AI agent designed to transform raw content into an original, SEO-optimized YouTube script.  \nYou take in one or more content sources and rewrite them into a fresh script that fits the brand’s tone, category, and output type.\n\n# Context\nThe user will provide parameters through JSON fields:\n- **Category**\n- **Tone** \n- **Output Type**\n- **Content** \n- **Requirements**\n\nThese may originate from YouTube transcripts, website content, or RSS feeds.\n\nYour task is to extract insights, rewrite everything uniquely, and produce a YouTube-ready script that matches tone, style, SEO rules, and output type.\n\n# Instructions\n\n## 1. Analyze the Input\n- Extract the meaningful insights from `Content`.\n- Ignore irrelevant UI text, filler, broken text, or repeated segments.\n- Identify the core narrative and transform it into something new.\n\n## 2. Rewrite Into a Unique YouTube Script\nYour rewritten script must:\n- Be **100% original** (NO copying or close paraphrasing)\n- Match the **Category**, **Tone**, and **Output Type**\n- Follow YouTube SEO best practices:\n  - Strong first 5-second hook\n  - Clear narrative flow\n  - Retention pacing\n  - Natural keyword use\n  - Engagement moments\n  - CTA (if appropriate)\n\n## 3. Script Structure (Mandatory)\nYour script MUST contain these five sections:\n\n1. **Hook**  \n2. **Intro**  \n3. **Main Content**  \n4. **Conclusion**  \n5. **CTA**\n\n## 4. Output Format (Important)\nYou MUST output the final script **as JSON** using this exact schema:\n\n```json\n{\n  \"hook\": \"\",\n  \"intro\": \"\",\n  \"main_content\": \"\",\n  \"conclusion\": \"\",\n  \"cta\": \"\"\n}\n```\n\n---\n"
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 3,
      "position": [
        560,
        48
      ],
      "id": "e308a149-1aaa-4e56-90fd-d6fc46cc1245",
      "name": "AI Agent"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "3a3fec7a-a6a8-41c1-9937-79a5aedea2e4",
              "name": "category",
              "value": "={{ $('Webhook').item.json.body.category }}",
              "type": "string"
            },
            {
              "id": "dd362d2f-26fb-4807-8245-a1f74837d288",
              "name": "tone",
              "value": "={{ $('Webhook').item.json.body.tone }}",
              "type": "string"
            },
            {
              "id": "a870f649-ae63-4727-8565-b106a578bb2d",
              "name": "output_type",
              "value": "={{ $('Webhook').item.json.body.output_type }}",
              "type": "string"
            },
            {
              "id": "bca89a89-fa14-4689-88e7-c28354a1ab95",
              "name": "content",
              "value": "={{ $json.content }}",
              "type": "string"
            },
            {
              "id": "9d6be523-900a-4618-8c91-52de464ebdd1",
              "name": "requirements",
              "value": "={{ $('Webhook').item.json.body.requirements }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        336,
        -144
      ],
      "id": "36577db9-df94-47d2-be29-e3f6d1274b91",
      "name": "Edit Fields"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [
        576,
        272
      ],
      "id": "f8f81c72-bee6-437f-9207-07450e5b0259",
      "name": "Google Gemini Chat Model",
      "credentials": {
        "googlePalmApi": {
          "id": "EqsWoOAROBrQt7Qp",
          "name": "321arifali"
        }
      }
    },
    {
      "parameters": {
        "schemaType": "manual",
        "inputSchema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"hook\": {\n      \"type\": \"string\",\n      \"description\": \"Strong opening hook that grabs attention immediately.\"\n    },\n    \"intro\": {\n      \"type\": \"string\",\n      \"description\": \"Introduction to the video topic and context.\"\n    },\n    \"main_content\": {\n      \"type\": \"string\",\n      \"description\": \"Body of the YouTube script rewritten from provided content.\"\n    },\n    \"conclusion\": {\n      \"type\": \"string\",\n      \"description\": \"Closing insights summarizing the main message.\"\n    },\n    \"cta\": {\n      \"type\": \"string\",\n      \"description\": \"Call-to-action encouraging engagement from viewers.\"\n    }\n  },\n  \"required\": [\n    \"hook\",\n    \"intro\",\n    \"main_content\",\n    \"conclusion\",\n    \"cta\"\n  ]\n}\n"
      },
      "type": "@n8n/n8n-nodes-langchain.outputParserStructured",
      "typeVersion": 1.3,
      "position": [
        704,
        272
      ],
      "id": "56099fb5-8b4f-407d-bcbc-ff58e290697d",
      "name": "Structured Output Parser"
    },
    {
      "parameters": {
        "url": "=https://r.jina.ai/{{ $json.body.source_url }}",
        "options": {
          "redirect": {
            "redirect": {}
          }
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.3,
      "position": [
        -112,
        48
      ],
      "id": "9c5b76fb-19c4-4cbe-ad03-26994caeda43",
      "name": "HTTP Request1"
    },
    {
      "parameters": {
        "jsCode": "function cleanText(t) {\n  return t\n    // Remove all parenthetical content\n    .replace(/\\([^()]*\\)/g, \"\")\n    // Remove URLs\n    .replace(/https?:\\/\\/\\S+/gi, \"\")\n    // Remove markdown links\n    .replace(/\\[.*?\\]\\(.*?\\)/g, \"\")\n    // Remove leftover brackets\n    .replace(/[\\[\\]\\(\\)]/g, \"\")\n    // Remove multiple dashes, markdown dividers\n    .replace(/[-=]{3,}/g, \"\")\n    // Remove list bullets\n    .replace(/^\\s*[\\*\\-]\\s+/gm, \"\")\n    // Remove numbered nav lists\n    .replace(/^\\s*\\d+\\.\\s*$/gm, \"\")\n    // Remove short junk lines\n    .replace(/^\\s*[A-Za-z]{0,2}\\s*$/gm, \"\")\n    // Collapse whitespace\n    .replace(/[ \\t]+/g, \" \")\n    .replace(/\\n{3,}/g, \"\\n\\n\")\n    .trim();\n}\n\nfunction extractUseful(html) {\n  // Remove scripts, styles etc.\n  html = html\n    .replace(/<script[\\s\\S]*?<\\/script>/gi, \"\")\n    .replace(/<style[\\s\\S]*?<\\/style>/gi, \"\")\n    .replace(/<header[\\s\\S]*?<\\/header>/gi, \"\")\n    .replace(/<footer[\\s\\S]*?<\\/footer>/gi, \"\")\n    .replace(/<nav[\\s\\S]*?<\\/nav>/gi, \"\")\n    .replace(/<aside[\\s\\S]*?<\\/aside>/gi, \"\")\n    .replace(/<form[\\s\\S]*?<\\/form>/gi, \"\")\n    .replace(/<iframe[\\s\\S]*?<\\/iframe>/gi, \"\");\n\n  // Extract only the main readable content using keyword anchors\n  const start = html.indexOf(\"Vibe Coding at its Best\");\n  const end = html.indexOf(\"The only question left now\");\n\n  if (start === -1 || end === -1) {\n    return \"ERROR: Article boundaries not found.\";\n  }\n\n  let article = html.substring(start, end);\n\n  // Remove all HTML tags\n  article = article.replace(/<[^>]+>/g, \"\\n\");\n\n  // Clean garbage formatting\n  article = cleanText(article);\n\n  // Remove extra short nonsense lines\n  const lines = article\n    .split(\"\\n\")\n    .map(l => l.trim())\n    .filter(l => l.length > 20); // Keeps meaningful lines only\n\n  return lines.join(\"\\n\\n\");\n}\n\n// -------- n8n return -------\nconst raw = items[0].json.data;\nconst cleaned = extractUseful(raw);\n\nreturn [{ json: { content: cleaned } }];\n"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        112,
        48
      ],
      "id": "2f31f930-aedc-44b1-a204-e7f68ddac4d5",
      "name": "Code in JavaScript1"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "3a3fec7a-a6a8-41c1-9937-79a5aedea2e4",
              "name": "category",
              "value": "={{ $('Webhook').item.json.body.category }}",
              "type": "string"
            },
            {
              "id": "dd362d2f-26fb-4807-8245-a1f74837d288",
              "name": "tone",
              "value": "={{ $('Webhook').item.json.body.tone }}",
              "type": "string"
            },
            {
              "id": "a870f649-ae63-4727-8565-b106a578bb2d",
              "name": "output_type",
              "value": "={{ $('Webhook').item.json.body.output_type }}",
              "type": "string"
            },
            {
              "id": "bca89a89-fa14-4689-88e7-c28354a1ab95",
              "name": "content",
              "value": "={{ $json.content }}",
              "type": "string"
            },
            {
              "id": "9d6be523-900a-4618-8c91-52de464ebdd1",
              "name": "requirements",
              "value": "={{ $('Webhook').item.json.body.requirements }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        336,
        48
      ],
      "id": "49f24bff-0195-42e3-b31f-a8266256b75e",
      "name": "Edit Fields1"
    },
    {
      "parameters": {
        "url": "={{ $json.body.source_url }}",
        "options": {}
      },
      "type": "n8n-nodes-base.rssFeedRead",
      "typeVersion": 1.2,
      "position": [
        -112,
        240
      ],
      "id": "6c2a2886-fa7b-46a4-aeff-54e70495ecd9",
      "name": "RSS Read"
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.limit",
      "typeVersion": 1,
      "position": [
        112,
        240
      ],
      "id": "757fd0aa-acce-4e29-9895-d58faf1f369f",
      "name": "Limit"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "3a3fec7a-a6a8-41c1-9937-79a5aedea2e4",
              "name": "category",
              "value": "={{ $('Webhook').item.json.body.category }}",
              "type": "string"
            },
            {
              "id": "dd362d2f-26fb-4807-8245-a1f74837d288",
              "name": "tone",
              "value": "={{ $('Webhook').item.json.body.tone }}",
              "type": "string"
            },
            {
              "id": "a870f649-ae63-4727-8565-b106a578bb2d",
              "name": "output_type",
              "value": "={{ $('Webhook').item.json.body.output_type }}",
              "type": "string"
            },
            {
              "id": "bca89a89-fa14-4689-88e7-c28354a1ab95",
              "name": "content",
              "value": "={{ $json.contentSnippet }}",
              "type": "string"
            },
            {
              "id": "9d6be523-900a-4618-8c91-52de464ebdd1",
              "name": "requirements",
              "value": "={{ $('Webhook').item.json.body.requirements }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        336,
        240
      ],
      "id": "544ab919-6c9e-40bc-863c-10e05878b88b",
      "name": "Edit Fields2"
    },
    {
      "parameters": {
        "enableResponseOutput": true,
        "respondWith": "json",
        "responseBody": "={\n  \"job_id\": \"{{ $json.job_id }}\",\n  \"status\": \"queued\",\n  \"eta_seconds\": 30\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.4,
      "position": [
        912,
        48
      ],
      "id": "0f78d1da-ca2a-4724-af15-23ec8b37fe07",
      "name": "Respond to Webhook",
      "alwaysOutputData": true
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Switch",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch": {
      "main": [
        [
          {
            "node": "Code in JavaScript",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "HTTP Request1",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "RSS Read",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code in JavaScript": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request": {
      "main": [
        [
          {
            "node": "Edit Fields",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Edit Fields": {
      "main": [
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Gemini Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Structured Output Parser": {
      "ai_outputParser": [
        [
          {
            "node": "AI Agent",
            "type": "ai_outputParser",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request1": {
      "main": [
        [
          {
            "node": "Code in JavaScript1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code in JavaScript1": {
      "main": [
        [
          {
            "node": "Edit Fields1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Edit Fields1": {
      "main": [
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "RSS Read": {
      "main": [
        [
          {
            "node": "Limit",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Limit": {
      "main": [
        [
          {
            "node": "Edit Fields2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Edit Fields2": {
      "main": [
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "cebc99df97e291a83b208cb28ceb96f286ddef0bfe6a6975751c5ced1b7d6efb"
  }
}