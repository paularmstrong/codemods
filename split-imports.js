const isPropTypes = path => path.value.source.value === 'prop-types' && path.value.specifiers.length === 1;

export default function transformer(file, api) {
  const j = api.jscodeshift;

  const propTypesImport = [];
  const specifiers = [];
  const source = j(file.source)
    .find(j.ImportDeclaration)
    .filter(isPropTypes)
    .forEach(path => propTypesImport.push(path));

  if (propTypesImport.length > 1) {
    throw new Error('too many prop-types imports');
  }
  if (!propTypesImport.length) {
    return;
  }

  const propTypesNamespace = propTypesImport[0].value.specifiers[0].local.name;

  const modifiedSource = j(file.source)
    .find(j.MemberExpression)
    .filter(
      path => path.value.object.type === 'Identifier' && path.value.object.name === propTypesNamespace
    )
    .forEach(path => {
      if (specifiers.indexOf(path.value.property.name) === -1) {
        specifiers.push(path.value.property.name);
      }
      j(path).replaceWith(path.value.property);
    })
    .toSource({ quote: 'single' });

  return j(modifiedSource)
    .find(j.ImportDeclaration)
    .filter(isPropTypes)
    .forEach(path => {
      j(path).replaceWith(
        j.importDeclaration(
          specifiers.sort().map(s => j.importSpecifier(j.identifier(s))),
          j.literal('prop-types')
        )
      );
    })
    .toSource({ quote: 'single' });
}
