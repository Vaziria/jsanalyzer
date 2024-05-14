
import acorn from 'acorn';
import * as fs from 'fs';
import walk from "acorn-walk";
import { LooseParser } from 'acorn-loose';
import * as neo4j from "neo4j-driver";
import { OpenNeo, WriteNode } from './src/database';
import { Driver } from 'neo4j-driver';


function GetAst():Promise<acorn.Program> {
    var prom = new Promise<acorn.Program> (function(resolve, reject) {
        fs.readFile("javascript.js", 'utf8', function(err, data){
            var ast = LooseParser.parse(data, {
                locations: true,
                ecmaVersion: 7
            })
            resolve(ast)
        })
    })

    return prom
}

class CBlockStatement implements acorn.BlockStatement {
    constructor(source: acorn.BlockStatement){
        Object.assign(this, source)
    }
    type: 'BlockStatement';
    body: acorn.Statement[];
    start: number;
    end: number;
    range?: [number, number];
    loc?: acorn.SourceLocation;

    public ListVariableDeclaration() {
        return this.body.filter(n => n.type === "VariableDeclaration")
    }

    public ListFunctionDeclaration(): acorn.FunctionDeclaration[] {
        return this.body.filter(n => n.type === "FunctionDeclaration") as acorn.FunctionDeclaration[]
    }
}


function CheckNode(node: acorn.Literal, state: unknown, ancestors: acorn.Node[]){
    const count = ancestors.filter(n => {
        var loc = n.loc
        var startLine = loc.start.line
        if(startLine == 49157) {
            return true
        }

        return false
    }).length

    const pathd = ancestors.map(n => n.type)
    if(count > 0) {
        // console.log(pathd)
    }

    ancestors.reverse()

    let c = 0
    for(const n of ancestors) {
        c = c+1

        if(n.type === "BlockStatement") {
            const block = new CBlockStatement(n as acorn.BlockStatement)
            
            const lstfunc = block.ListFunctionDeclaration()
            for(const item of lstfunc) {
                console.log(item.id.name, item.loc.start.line, c)

                // if(item.id.name === "iWt"){
                //     console.log(item.id.name, item.loc.start.line, c)
                //     break
                // }
            }
            break
        }
    }

}


async function FindStatement(line: number, type: string, ast: acorn.Program) {
    
    // walk.fullAncestor(ast, (node: acorn.Node,
    //     state: TState,
    //     ancestors: acorn.Node[],
    //     type: string) => {

    // })

    await OpenNeo(async (driver: Driver) => {
        
        const nodePromise = new Promise<acorn.Node>((resolve, reject)=> {
            walk.ancestor(ast, {
                FunctionExpression: (node: acorn.FunctionExpression, state: unknown, ancestors: acorn.Node[]) => {
                    if(node.loc.start.line !== line){
                        return
                    }
        
                    let found = false
                    walk.ancestor(node, {
                        Identifier: (node: acorn.Identifier, state: unknown, ancestors: acorn.Node[]) => {
                            
                            if (!found){
                                found = true
                                resolve(node)  
                            }
                              
                        }
                    })

                    reject("end")
                }
            })
        })
     
        const node = await nodePromise

        const session = driver.session({
            database: 'shopee-analitic',
            defaultAccessMode: neo4j.session.WRITE
        })
        console.log(node)
        await WriteNode(session, node)
        
        await session.close()
        
    })

    
}


async function main() {
    var ast = await GetAst()
    // walk.full(ast, node => {
    //     if(node.loc.start.line === 49155){
    //         console.log(node)
    //         // break
    //     }
    // })
    await FindStatement(49155, "", ast)
}


main().then(() => {
    console.log("finish")
}).catch(err => {
    throw err
})