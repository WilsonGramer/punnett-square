window.onload = () => {
    // https://stackoverflow.com/a/15164958/5569234 (modified)
    function createTable(tableData) {
        var table = document.createElement('table')
        var tableBody = document.createElement('tbody')

        tableData.forEach(rowData => {
            var row = document.createElement('tr')

            rowData.forEach(cellData => {
                var cell = document.createElement('td')
                cell.appendChild(document.createTextNode(cellData.value))
                cell.style.backgroundColor = cellData.color
                row.appendChild(cell)
            })

            tableBody.appendChild(row)
        })

        table.appendChild(tableBody)

        return table
    }

    // https://stackoverflow.com/a/4331218/5569234 (modified)
    function allPossibleCases(arr) {
        if (arr.length == 1) {
            return arr[0]
        }

        let result = []
        // recur with the rest of array
        let allCasesOfRest = allPossibleCases(arr.slice(1))
        for (const i in allCasesOfRest) {
            for (const j in arr[0]) {
                result.push(arr[0][j] + allCasesOfRest[i])
            }
        }
        return result
    }

    function alleles(parent) {
        const genes = _.chunk(parent, 2).map(x => x.join(''))
        return _.uniq(allPossibleCases(genes))
    }

    // https://stackoverflow.com/a/5286111/5569234
    function sortAlleles(x, y) {
        if (x.toLowerCase() !== y.toLowerCase()) {
            x = x.toLowerCase()
            y = y.toLowerCase()
        }
        return x > y ? 1 : (x < y ? -1 : 0)
    }

    function punnettSquare(momAlleles, dadAlleles) {
        const possibleGenotypes = allPossibleCases([
            [...momAlleles],
            [...dadAlleles]
        ])

        // adjust the order of each letter in the genotype representation like this:
        // 'bAaB' => 'AaBb'
        for (const i in possibleGenotypes) {
            const item = possibleGenotypes[i]

            const r = _.sortBy(item, x => x.toLowerCase()).join('')
            let r2 = _.sortBy(r, x => x.toLowerCase())
            
            console.log('!!!!!', r2)

            r2.sort(sortAlleles)

            possibleGenotypes[i] = r2.join('')
        }

        const result = _.chunk(possibleGenotypes, momAlleles.length)

        return result
    }

    // returns the counts of each color, too
    function colorize(punnettSquare) {
        let result = []
        let colors = {}
        let colorCounts = {}

        for (const row of punnettSquare) {
            let rowResult = []

            for (const item of row) {
                // only take the first part of the allele because we know that the 
                // dominant trait (capital letter) is sorted to appear at the front
                // eg. 'AaBb' => 'AB', 'aabb' => 'ab', 'AABb' => 'AB'
                const splitItem = _.chunk(item.split(''), 2).map(x => x[0]).join('')

                if (!colors[splitItem]) {
                    // https://stackoverflow.com/a/43195379/5569234
                    colors[splitItem] = (
                        "hsl(" + 360 * Math.random() + ',' +
                        (25 + 70 * Math.random()) + '%,' +
                        (75 + 10 * Math.random()) + '%)'
                    )
                }

                if (!colorCounts[splitItem]) colorCounts[splitItem] = 0
                colorCounts[splitItem] += 1

                rowResult.push({
                    value: item,
                    color: colors[splitItem],
                    colorKey: splitItem
                })
            }

            result.push(rowResult)
        }

        return [result, colorCounts]
    }

    ////////////////

    // Just basic validation; nonsensical values might still appear for various edge cases
    // (eg. not comparing the same genes, like 'AaBb' to 'XxYy')
    function validate(mom, dad) {
        return (
            // check valid length
            mom.length >= 2 && dad.length >= 2 &&
            mom.length == dad.length &&
            mom.length % 2 == 0 && dad.length % 2 == 0 &&
            
            // check that adjacent alleles are the same letter (eg. true for 'AabbCC', but 
            // not 'AbbCaB')
            _.chunk(mom, 2).map(x => x.map(y => y.toLowerCase())).every(x => x[0] == x[1]) &&
            _.chunk(dad, 2).map(x => x.map(y => y.toLowerCase())).every(x => x[0] == x[1]) &&
            
            // check that alleles are in the right order (eg. 'AaBbCc')
            mom.split('').sort(sortAlleles).join('') == mom &&
            dad.split('').sort(sortAlleles).join('') == dad
        )
    }

    ////////////////

    function displayResult(mom, dad, _momAlleles = null, _dadAlleles = null) {
        const momAlleles = _momAlleles || alleles(mom)
        const dadAlleles = _dadAlleles || alleles(dad)

        const result = punnettSquare(momAlleles, dadAlleles)
        const [colorized, colorCounts] = colorize(result)
        const phenotypes = Object.keys(colorCounts)

        ////////////////

        let allelesHeading = document.createElement('h3')
        allelesHeading.appendChild(document.createTextNode('Alleles:'))
        document.body.appendChild(allelesHeading)

        function createAllelesLabel(name, alleles) {
            let container = document.createElement('div')

            let nameLabel = document.createElement('span')
            nameLabel.className = 'name-label'
            nameLabel.appendChild(document.createTextNode(name + ':'))
            container.appendChild(nameLabel)

            for (const i in alleles) {
                const allele = alleles[i]

                let label = document.createElement('span')
                label.className = 'alleles-label'
                label.appendChild(document.createTextNode(allele))
                container.appendChild(label)

                if (i < alleles.length - 1) {
                    let comma = document.createTextNode(',')
                    container.appendChild(comma)
                }
            }

            return container
        }

        document.body.appendChild(createAllelesLabel('Mom', momAlleles))
        document.body.appendChild(createAllelesLabel('Dad', dadAlleles))

        ////////////////

        let resultHeading = document.createElement('h3')
        resultHeading.appendChild(document.createTextNode('Genotypes:'))
        document.body.appendChild(resultHeading)

        document.body.appendChild(createTable(colorized))

        ////////////////

        let phenotypesHeading = document.createElement('h3')
        phenotypesHeading.appendChild(document.createTextNode('Phenotypes:'))
        document.body.appendChild(phenotypesHeading)

        for (const phenotype of phenotypes) {
            const item = colorized.flat(2).find(x => x.colorKey == phenotype)
            const percent = (colorCounts[phenotype] / colorized.flat(2).length) * 100

            let label = document.createElement('div')

            let genotypeLabel = document.createElement('span')
            genotypeLabel.className = 'phenotype-label'
            genotypeLabel.appendChild(document.createTextNode(phenotype))
            genotypeLabel.style.backgroundColor = item.color
            label.appendChild(genotypeLabel)

            let countLabel = document.createTextNode(`: ${colorCounts[phenotype]} (${percent}%)`)
            label.appendChild(countLabel)

            document.body.appendChild(label)
        }

        ////////////////

        let ratiosHeading = document.createElement('h3')
        ratiosHeading.appendChild(document.createTextNode('Ratios:'))
        document.body.appendChild(ratiosHeading)

        const genes = _.uniq(mom.split('').map(x => x.toUpperCase()))
        for (const i in genes) {
            const gene = genes[i]
            const genotypesForGene = result.flat(2).map(x => x.charAt(i * 2) + x.charAt(i * 2 + 1))
            console.log(genotypesForGene)
            
            const dominantCount = genotypesForGene.filter(x => x == `${gene}${gene}`).length
            const heterozygousCount = genotypesForGene.filter(x => x == `${gene}${gene.toLowerCase()}`).length
            const recessiveCount = genotypesForGene.filter(x => x == `${gene.toLowerCase()}${gene.toLowerCase()}`).length
        
            let container = document.createElement('div')
            container.className = 'ratio-details-container'
            
            let label = document.createElement('div')
            label.className = 'ratios-label'
            label.appendChild(document.createTextNode(`${gene}/${gene.toLowerCase()}`))
            
            container.appendChild(label)

            let dominantDetails = document.createElement('div')
            dominantDetails.appendChild(document.createTextNode(`${dominantCount} dominant (${dominantCount / genotypesForGene.length * 100}% chance)`))
            container.appendChild(dominantDetails)
            
            let heterozygousDetails = document.createElement('div')
            heterozygousDetails.appendChild(document.createTextNode(`${heterozygousCount} heterozygous (${heterozygousCount / genotypesForGene.length * 100}% chance)`))
            container.appendChild(heterozygousDetails)
            
            let recessiveDetails = document.createElement('div')
            recessiveDetails.appendChild(document.createTextNode(`${recessiveCount} recessive (${recessiveCount / genotypesForGene.length * 100}% chance)`))
            container.appendChild(recessiveDetails)
            
            document.body.appendChild(container)
        }
    }

    let momValue = null
    let dadValue = null

    function load() {
        document.body.innerHTML = ''
        
        let title = document.createElement('h2')
        title.appendChild(document.createTextNode('Wilson Gramer\'s Punnett Square Maker'))
        document.body.appendChild(title)

        let inputDirectionsLabel = document.createElement('small')
        inputDirectionsLabel.appendChild(document.createTextNode('Input parents\' genes in the form "AaBbCc...":'))
        document.body.appendChild(inputDirectionsLabel)

        function createInputContainer(name, prevValue) {
            let container = document.createElement('div')

            let label = document.createElement('span')
            label.className = 'name-label'
            label.appendChild(document.createTextNode(name + ':'))
            container.appendChild(label)

            let input = document.createElement('input')
            input.type = 'text'
            input.id = 'input-' + name
            input.value = prevValue
            container.appendChild(input)

            return container
        }

        document.body.appendChild(createInputContainer('Mom', momValue))
        document.body.appendChild(createInputContainer('Dad', dadValue))

        let submitButton = document.createElement('button')
        submitButton.type = 'button'
        submitButton.innerHTML = 'Submit'
        submitButton.addEventListener('click', submit)
        document.body.appendChild(submitButton)
    }

    ////////////////

    function submit() {
        const mom = document.getElementById('input-Mom').value
        const dad = document.getElementById('input-Dad').value

        momValue = mom
        dadValue = dad
        
        if (!validate(mom, dad)) {
            alert('Invalid input.')
            return
        }
        
        load()
        displayResult(mom, dad)
    }

    load()
    /* displayResult('AaBBCc', 'aaBbCc') */
}