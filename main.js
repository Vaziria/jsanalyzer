const {Parser} = require("acorn")
const fs = require("fs")
const walk = require("acorn-walk")



// function noisyReadToken(Parser) {
//     return class extends Parser {
//       readToken(code) {
//         console.log(String.fromCharCode(code), "---", code)
//         super.readToken(code)
//       }
//     }
// }


const MyParser = Parser.extend(
  require("acorn-jsx")(),
//   noisyReadToken,
)

function getAst(){
    var prom = new Promise(function(resolve, reject) {
        fs.readFile("javascript.js", 'utf8', function(err, data){
            var ast = MyParser.parse(data, {
                locations: true
            })
            resolve(ast)
        })
    })

    return prom
}



function saveAst(ast) {
    var content = JSON.stringify(ast, null, 4)
    fs.writeFile("./ast_javascript.js", content, function(err) {
        if(err) {
            console.log(err)
        }        
    })
}

function toJson(obj){
    return JSON.stringify(obj, null, 4)
}


var fungsiGetShortToken = 49155

function walkNode(node) {
    var loc = node.loc
    var startLine = loc.start.line
    if(startLine == fungsiGetShortToken) {
        if (node.type == "FunctionExpression") {

            console.log(node.type)

            blockstatement = node.body.body
            for(state of blockstatement){
                if(state.type == "ReturnStatement") {
                    console.log(toJson(state))
                }
                
            }
        }
        
    }

    
}

function checkNode(node, state, ancestors) {
    count = ancestors.filter(n => {
        var loc = n.loc
        var startLine = loc.start.line
        if(startLine == 49157) {
            return true
        }

        return false
    }).length

    pathd = ancestors.map(n => n.type)
    if(count > 0) {
        console.log(pathd)
    }

    ancestors.reverse()
    ancestors.map(n => {
        if(n.type === "BlockStatement") {
            for(b of n.body){
                if (b.type === "VariableDeclaration"){
                    for(iden of b.declarations){
                        // console.log(iden)
                        if(iden.id.type == "Identifier"){
                            if(iden.id.name == "iWt"){
                                console.log(iden.id.name)
                            }
                            // console.log(iden.id.name)
                        }
                    }
                }
                
            }
        }
    })
    
}


async function main() {
    var ast = await getAst()
    // walk.full(ast, walkNode)
    walk.ancestor(ast, {
        Literal: checkNode
    })

    // saveAst(ast)
}


main().then(() => {
    console.log("finish")
}).catch(err => {
    throw err
})