/*
 * Copyright 2020 ABSA Group Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getText } from '../../util/expressions'
import { AttributeVM } from '../viewModels/attributeVM'


export namespace OperationProperty {

  export type NativeProperties = Record<string, any>

  export type ExtraPropertyValue<T> = {
    label: string
    value: T
  }

  export type ExpressionValue = {
    value: string
    rawValue: Record<string, any>
  }

  export type ExtraPropertyValuePrimitive = ExtraPropertyValue<string | number>
  export type ExtraPropertyValueExpression = ExtraPropertyValue<ExpressionValue>
  export type ExtraPropertyValueJson = ExtraPropertyValue<any[] | Record<any, any>>

  export type ExtraProperties = {
    primitive: ExtraPropertyValuePrimitive[]
    expression: ExtraPropertyValueExpression[]
    json: ExtraPropertyValueJson[]
  }

  export function decorateJsonProperty(propValue: ExtraPropertyValueJson): ExtraPropertyValueJson {
    // make label human readable "camelCase" => "Camel Case"
    const regex = new RegExp('([a-z])([A-Z])', 'g')
    let label = propValue.label.replace(regex, '$1 $2')
    label = label.substring(0, 1).toUpperCase() + label.substring(1)
    return {
      ...propValue,
      label
    }
  }

  export function decorateExpressionProperty(propValue: ExtraPropertyValue<Record<string, any>>,
                                             attributesList: AttributeVM[]): ExtraPropertyValueExpression {
    const jsonLikeProp = decorateJsonProperty(propValue)
    return {
      ...jsonLikeProp,
      value: {
        value: getText(propValue.value, attributesList),
        rawValue: propValue.value
      }
    }
  }

  export function isExpresionProperty(propertyValue: Record<string, any>): boolean {
    return propertyValue._typeHint && (propertyValue._typeHint as string).startsWith('expr.')
  }

  export function parseExtraOptions(nativeProperties: NativeProperties, attributesList: AttributeVM[]): ExtraProperties {
    const extraProperties: ExtraProperties = {
      primitive: [],
      expression: [],
      json: []
    }

    return Object.keys(nativeProperties)
      .reduce(
        (result, key) => {
          const value = nativeProperties[key]

          if (value === undefined || value === null) {
            return result
          }

          const primitivePropValue = {
            label: key,
            value
          }

          if (typeof value === 'string' || typeof value === 'number') {
            extraProperties.primitive.push(primitivePropValue)
          }
          else if (typeof value === 'object' && isExpresionProperty(value)) {
            try {
              const decoratedValue = decorateExpressionProperty(primitivePropValue, attributesList)
              extraProperties.expression.push(decoratedValue)
            } catch (e) {
              console.error(`Expresion decoration error`, e)
            }
          }
          else if (Array.isArray(value) || typeof value === 'object') {
            extraProperties.json.push(
              decorateJsonProperty(primitivePropValue)
            )
          }

          return result
        },
        extraProperties
      )

  }


}
