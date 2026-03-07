"""
Chat Response Transformer Service
Transforms AI responses into frontend-compatible visualization configs
"""
import json
import logging
from typing import Any, Dict, List, Optional
import uuid

logger = logging.getLogger(__name__)


class ChatResponseTransformer:
    """
    Transforms raw AI responses into structured visualization configs
    for frontend consumption.
    """
    
    @staticmethod
    def transform_response(
        raw_response: str,
        session_id: str,
        conversation_id: str,
        context_injected: bool
    ) -> Dict[str, Any]:
        """
        Transform raw AI response into frontend-compatible format.
        
        Args:
            raw_response: Stringified JSON from AI
            session_id: Session identifier
            context_injected: Whether context was injected
            
        Returns:
            Transformed response dict with visualization config
        """
        try:
            # Parse the stringified JSON response
            ai_data = json.loads(raw_response)
            
            # Extract base fields
            insight = ai_data.get('insight', '')
            widget_type = ai_data.get('widget_type', '')
            chart_type = ai_data.get('chart_type')
            raw_data = ai_data.get('data', [])
            
            # Transform data based on widget type
            transformed_data = ChatResponseTransformer._transform_data(
                widget_type=widget_type,
                chart_type=chart_type,
                raw_data=raw_data,
                insight=insight
            )
            
            # Build response
            response = {
                'insight': insight,
                'widget_type': widget_type,
                'session_id': session_id,
                'context_injected': context_injected,
                'data': transformed_data,
                'conversation_id': conversation_id,
                'widgetId': str(uuid.uuid4())
            }
            
            # Only include chart_type if widget_type is 'chart'
            if widget_type == 'chart' and chart_type:
                response['chart_type'] = chart_type
            
            logger.info(f"Transformed response for widget_type: {widget_type}")
            return response
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            raise ValueError(f"Invalid JSON response from AI: {str(e)}")
        except Exception as e:
            logger.error(f"Error transforming response: {e}", exc_info=True)
            raise
    
    @staticmethod
    def _transform_data(
        widget_type: str,
        chart_type: Optional[str],
        raw_data: List[Dict[str, Any]],
        insight: str
    ) -> Any:
        """
        Transform raw data based on widget type.
        
        Args:
            widget_type: Type of widget (summary_card, chart, grid)
            chart_type: Type of chart (if widget_type is chart)
            raw_data: Raw data from AI
            insight: Insight text for context
            
        Returns:
            Transformed data structure for frontend
        """
        if widget_type == 'summary_card':
            return ChatResponseTransformer._transform_summary_card(raw_data, insight)
        elif widget_type == 'grid' or widget_type == 'conversational':
            # Grid data is returned as-is
            return raw_data
        elif widget_type == 'chart':
            # Transform to Highcharts config
            return ChatResponseTransformer._transform_chart(raw_data, chart_type, insight)
        else:
            # Unknown widget type, return raw data
            logger.warning(f"Unknown widget_type: {widget_type}, returning raw data")
            return raw_data
    
    @staticmethod
    def _transform_summary_card(
        raw_data: List[Dict[str, Any]],
        insight: str
    ) -> List[Dict[str, Any]]:
        """
        Transform raw data into summary card format.
        
        Expected frontend format:
        [
          {
            "title": "Total Revenue",
            "value": "₹4,52,000",
            "change": "+12%",  # Optional
            "trend": "up",     # Optional: 'up' | 'down'
            "icon": "DollarSign"  # Optional
          }
        ]
        
        Args:
            raw_data: Raw data from AI (e.g., [{"total_sales": "3516979.54"}])
            insight: Insight text to extract title/value
            
        Returns:
            List of summary card configs
        """
        summary_cards = []
        
        # If raw_data is empty or doesn't have the expected structure,
        # try to extract from insight
        if not raw_data or len(raw_data) == 0:
            logger.warning("No raw data provided for summary_card, using insight only")
            return ChatResponseTransformer._extract_from_insight(insight)
        
        # Process each data item
        for item in raw_data:
            for key, value in item.items():
                # Create a summary card for each key-value pair
                card = ChatResponseTransformer._create_summary_card(
                    key=key,
                    value=value,
                    insight=insight
                )
                summary_cards.append(card)
        
        return summary_cards
    
    @staticmethod
    def _create_summary_card(
        key: str,
        value: Any,
        insight: str
    ) -> Dict[str, Any]:
        """
        Create a single summary card config.
        
        Args:
            key: Data key (e.g., "total_sales")
            value: Data value (e.g., "3516979.54")
            insight: Insight text for context
            
        Returns:
            Summary card config dict
        """
        # Format the title (convert snake_case to Title Case)
        title = key.replace('_', ' ').title()
        
        # Format the value
        formatted_value = ChatResponseTransformer._format_value(value)
        
        # Build base card
        card: Dict[str, Any] = {
            'title': title,
            'value': formatted_value
        }
        
        # Optional fields (change, trend, icon) are not included
        # unless explicitly provided in the data
        # These can be added later based on AI response enhancements
        
        return card
    
    @staticmethod
    def _format_value(value: Any) -> str:
        """
        Format value for display.
        
        Args:
            value: Raw value (string, number, etc.)
            
        Returns:
            Formatted string
        """
        try:
            # Try to parse as float for number formatting
            num_value = float(value)
            
            # Format large numbers with commas
            if num_value >= 1000:
                return f"${num_value:,.2f}"
            else:
                return f"${num_value:.2f}"
        except (ValueError, TypeError):
            # Not a number, return as string
            return str(value)
    
    @staticmethod
    def _extract_from_insight(insight: str) -> List[Dict[str, Any]]:
        """
        Fallback: Extract summary card from insight text.
        
        Args:
            insight: Insight text (e.g., "Total sales in 2003 was $3,516,979.54")
            
        Returns:
            List with single summary card
        """
        # Simple extraction - can be enhanced with regex
        return [{
            'title': 'Result',
            'value': insight
        }]
    
    @staticmethod
    def _transform_chart(
        raw_data: List[Dict[str, Any]],
        chart_type: Optional[str],
        insight: str
    ) -> List[Dict[str, Any]]:
        """
        Transform raw data into Highcharts config format.
        
        Supported chart types: line, bar, column, pie
        
        Args:
            raw_data: Raw data from AI
            chart_type: Type of chart (line, bar, column, pie)
            insight: Insight text for chart title
            
        Returns:
            List of Highcharts config objects
        """
        if not chart_type:
            logger.warning("No chart_type provided, defaulting to 'line'")
            chart_type = 'line'
        
        chart_type = chart_type.lower()
        
        if chart_type in ['line', 'bar', 'column']:
            return [ChatResponseTransformer._transform_line_bar_column_chart(raw_data, chart_type, insight)]
        elif chart_type == 'pie':
            return [ChatResponseTransformer._transform_pie_chart(raw_data, insight)]
        else:
            logger.warning(f"Unsupported chart_type: {chart_type}, defaulting to 'line'")
            return [ChatResponseTransformer._transform_line_bar_column_chart(raw_data, 'line', insight)]
    
    @staticmethod
    def _transform_line_bar_column_chart(
        raw_data: List[Dict[str, Any]],
        chart_type: str,
        insight: str
    ) -> Dict[str, Any]:
        """
        Transform data for line, bar, or column charts.
        
        Expected AI data format:
        [
          {"max_sale": "$11,279.2", "year_id": "2003"},
          {"max_sale": "$12,536.5", "year_id": "2004"},
          {"max_sale": "$14,082.8", "year_id": "2005"}
        ]
        
        Args:
            raw_data: Raw data from AI
            chart_type: 'line', 'bar', or 'column'
            insight: Insight text for title
            
        Returns:
            Highcharts config object
        """
        if not raw_data or len(raw_data) == 0:
            logger.warning("No data provided for chart")
            return ChatResponseTransformer._get_empty_chart_config(chart_type, insight)
        
        # Extract keys from first data item
        first_item = raw_data[0]
        keys = list(first_item.keys())
        
        if len(keys) < 2:
            logger.warning(f"Insufficient data keys for chart: {keys}")
            return ChatResponseTransformer._get_empty_chart_config(chart_type, insight)
        
        # Assume first key is the value, second key is the category (x-axis)
        # This can be refined based on AI response patterns
        value_key = keys[0]
        category_key = keys[1]
        
        # Extract categories and values
        categories = []
        values = []
        
        for item in raw_data:
            category = str(item.get(category_key, ''))
            value_str = str(item.get(value_key, '0'))
            
            # Remove currency symbols and commas for numeric conversion
            value_clean = value_str.replace('$', '').replace(',', '').strip()
            
            try:
                value = float(value_clean)
            except ValueError:
                logger.warning(f"Could not convert value to float: {value_str}")
                value = 0
            
            categories.append(category)
            values.append(value)
        
        # Generate title from insight (first sentence)
        title = insight.split('.')[0] if insight else 'Chart'
        
        # Create Highcharts config
        config = {
            'chart': {'type': chart_type},
            'title': {'text': title},
            'xAxis': {'categories': categories},
            'yAxis': {
                'title': {'text': value_key.replace('_', ' ').title()}
            },
            'series': [{
                'name': value_key.replace('_', ' ').title(),
                'data': values,
                'color': '#5B5FEF'  # Primary brand color
            }],
            'credits': {'enabled': False}
        }
        
        return config
    
    @staticmethod
    def _transform_pie_chart(
        raw_data: List[Dict[str, Any]],
        insight: str
    ) -> Dict[str, Any]:
        """
        Transform data for pie charts.
        
        Expected AI data format:
        [
          {"category": "Healthy", "value": "70"},
          {"category": "Low Stock", "value": "20"},
          {"category": "Overstocked", "value": "10"}
        ]
        
        Args:
            raw_data: Raw data from AI
            insight: Insight text for title
            
        Returns:
            Highcharts pie chart config object
        """
        if not raw_data or len(raw_data) == 0:
            logger.warning("No data provided for pie chart")
            return ChatResponseTransformer._get_empty_chart_config('pie', insight)
        
        # Extract keys from first data item
        first_item = raw_data[0]
        keys = list(first_item.keys())
        
        if len(keys) < 2:
            logger.warning(f"Insufficient data keys for pie chart: {keys}")
            return ChatResponseTransformer._get_empty_chart_config('pie', insight)
        
        # Assume first key is the name/category, second key is the value
        name_key = keys[0]
        value_key = keys[1]
        
        # Color palette for pie slices
        colors = ['#5B5FEF', '#FFC107', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
        
        # Transform data to Highcharts pie format
        pie_data = []
        for idx, item in enumerate(raw_data):
            name = str(item.get(name_key, f'Category {idx + 1}'))
            value_str = str(item.get(value_key, '0'))
            
            # Remove currency symbols and commas
            value_clean = value_str.replace('$', '').replace(',', '').replace('%', '').strip()
            
            try:
                value = float(value_clean)
            except ValueError:
                logger.warning(f"Could not convert value to float: {value_str}")
                value = 0
            
            pie_data.append({
                'name': name,
                'y': value,
                'color': colors[idx % len(colors)]
            })
        
        # Generate title from insight
        title = insight.split('.')[0] if insight else 'Distribution'
        
        # Create Highcharts pie config
        config = {
            'chart': {'type': 'pie'},
            'title': {'text': title},
            'series': [{
                'name': value_key.replace('_', ' ').title(),
                'data': pie_data,
                'innerSize': '60%'  # Makes it a donut chart
            }],
            'credits': {'enabled': False}
        }
        
        return config
    
    @staticmethod
    def _get_empty_chart_config(chart_type: str, title: str) -> Dict[str, Any]:
        """
        Get empty chart config as fallback.
        
        Args:
            chart_type: Type of chart
            title: Chart title
            
        Returns:
            Empty Highcharts config
        """
        return {
            'chart': {'type': chart_type},
            'title': {'text': title or 'No Data'},
            'series': [],
            'credits': {'enabled': False}
        }


# Singleton instance
chat_transformer = ChatResponseTransformer()
