"""
Test script for chat response transformation
Run with: python test_chat_transformation.py
"""
import json
from app.services.chat_transformer import chat_transformer


def test_summary_card_transformation():
    """Test summary card transformation"""
    print("=" * 80)
    print("TEST 1: Summary Card Transformation")
    print("=" * 80)
    
    # Simulate AI response
    raw_response = json.dumps({
        "insight": "Total sales in 2003 was $3,516,979.54",
        "widget_type": "summary_card",
        "chart_type": None,
        "sql_query": "SELECT SUM(sales) AS total_sales FROM retail_db.sales WHERE year_id = 2003",
        "data": [{"total_sales": "3516979.540000001"}]
    })
    
    print("\nInput (Raw AI Response):")
    print(json.dumps(json.loads(raw_response), indent=2))
    
    # Transform
    result = chat_transformer.transform_response(
        raw_response=raw_response,
        session_id="test-session-123",
        context_injected=False
    )
    
    print("\nOutput (Transformed Response):")
    print(json.dumps(result, indent=2))
    
    # Verify
    assert result['widget_type'] == 'summary_card'
    assert result['insight'] == "Total sales in 2003 was $3,516,979.54"
    assert len(result['data']) == 1
    assert result['data'][0]['title'] == 'Total Sales'
    assert result['data'][0]['value'] == '$3,516,979.54'
    assert 'chart_type' not in result  # Should not be included for summary_card
    
    print("\n✅ Test passed!")


def test_grid_transformation():
    """Test grid transformation (data returned as-is)"""
    print("\n" + "=" * 80)
    print("TEST 2: Grid Transformation")
    print("=" * 80)
    
    # Simulate AI response
    raw_response = json.dumps({
        "insight": "Here are the risk alerts",
        "widget_type": "grid",
        "chart_type": None,
        "data": [
            {
                "title": "Risk Alerts",
                "rows": [
                    {
                        "title": "Stockout Risk: Premium Headphones",
                        "desc": "Predicted stockout in 3 days",
                        "severity": "high",
                        "time": "2h ago"
                    }
                ]
            }
        ]
    })
    
    print("\nInput (Raw AI Response):")
    print(json.dumps(json.loads(raw_response), indent=2))
    
    # Transform
    result = chat_transformer.transform_response(
        raw_response=raw_response,
        session_id="test-session-456",
        context_injected=True
    )
    
    print("\nOutput (Transformed Response):")
    print(json.dumps(result, indent=2))
    
    # Verify
    assert result['widget_type'] == 'grid'
    assert result['context_injected'] == True
    assert len(result['data']) == 1
    assert result['data'][0]['title'] == 'Risk Alerts'
    
    print("\n✅ Test passed!")


def test_multiple_summary_cards():
    """Test multiple summary cards from multiple data fields"""
    print("\n" + "=" * 80)
    print("TEST 3: Multiple Summary Cards")
    print("=" * 80)
    
    # Simulate AI response with multiple metrics
    raw_response = json.dumps({
        "insight": "Sales metrics for 2003",
        "widget_type": "summary_card",
        "chart_type": None,
        "data": [
            {
                "total_sales": "3516979.54",
                "total_orders": "1240",
                "average_order_value": "2836.27"
            }
        ]
    })
    
    print("\nInput (Raw AI Response):")
    print(json.dumps(json.loads(raw_response), indent=2))
    
    # Transform
    result = chat_transformer.transform_response(
        raw_response=raw_response,
        session_id="test-session-789",
        context_injected=False
    )
    
    print("\nOutput (Transformed Response):")
    print(json.dumps(result, indent=2))
    
    # Verify
    assert result['widget_type'] == 'summary_card'
    assert len(result['data']) == 3  # Three cards
    
    # Check each card
    titles = [card['title'] for card in result['data']]
    assert 'Total Sales' in titles
    assert 'Total Orders' in titles
    assert 'Average Order Value' in titles
    
    print("\n✅ Test passed!")


def test_chart_transformation():
    """Test chart transformation (column chart)"""
    print("\n" + "=" * 80)
    print("TEST 4: Chart Transformation (Column Chart)")
    print("=" * 80)
    
    # Simulate AI response for column chart
    raw_response = json.dumps({
        "insight": "The maximum sale per year from 2003 to 2005 was $14,082.8 in 2005, $12,536.5 in 2004, and $11,279.2 in 2003.",
        "widget_type": "chart",
        "chart_type": "column",
        "data": [
            {"max_sale": "$11,279.2", "year_id": "2003"},
            {"max_sale": "$12,536.5", "year_id": "2004"},
            {"max_sale": "$14,082.8", "year_id": "2005"}
        ]
    })
    
    print("\nInput (Raw AI Response):")
    print(json.dumps(json.loads(raw_response), indent=2))
    
    # Transform
    result = chat_transformer.transform_response(
        raw_response=raw_response,
        session_id="test-session-chart",
        context_injected=False
    )
    
    print("\nOutput (Transformed Response):")
    print(json.dumps(result, indent=2))
    
    # Verify
    assert result['widget_type'] == 'chart'
    assert result['chart_type'] == 'column'
    assert isinstance(result['data'], list)
    assert len(result['data']) == 1  # One chart config
    
    # Verify Highcharts config structure
    chart_config = result['data'][0]
    assert 'chart' in chart_config
    assert chart_config['chart']['type'] == 'column'
    assert 'title' in chart_config
    assert 'xAxis' in chart_config
    assert 'yAxis' in chart_config
    assert 'series' in chart_config
    assert len(chart_config['series']) == 1
    assert chart_config['series'][0]['data'] == [11279.2, 12536.5, 14082.8]
    assert chart_config['xAxis']['categories'] == ['2003', '2004', '2005']
    
    print("\n✅ Test passed! Chart transformed to Highcharts config")


def test_error_handling():
    """Test error handling for invalid JSON"""
    print("\n" + "=" * 80)
    print("TEST 5: Error Handling")
    print("=" * 80)
    
    # Invalid JSON
    raw_response = "This is not valid JSON"
    
    print("\nInput (Invalid JSON):")
    print(raw_response)
    
    try:
        result = chat_transformer.transform_response(
            raw_response=raw_response,
            session_id="test-session-error",
            context_injected=False
        )
        print("\n❌ Test failed! Should have raised ValueError")
    except ValueError as e:
        print(f"\n✅ Test passed! Caught expected error: {str(e)}")


def test_line_chart_transformation():
    """Test line chart transformation"""
    print("\n" + "=" * 80)
    print("TEST 6: Line Chart Transformation")
    print("=" * 80)
    
    raw_response = json.dumps({
        "insight": "Sales trend over time",
        "widget_type": "chart",
        "chart_type": "line",
        "data": [
            {"sales": "320000", "month": "Jan"},
            {"sales": "340000", "month": "Feb"},
            {"sales": "380000", "month": "Mar"}
        ]
    })
    
    print("\nInput (Raw AI Response):")
    print(json.dumps(json.loads(raw_response), indent=2))
    
    result = chat_transformer.transform_response(
        raw_response=raw_response,
        session_id="test-line-chart",
        context_injected=False
    )
    
    print("\nOutput (Transformed Response):")
    print(json.dumps(result, indent=2))
    
    # Verify
    assert result['widget_type'] == 'chart'
    assert result['chart_type'] == 'line'
    chart_config = result['data'][0]
    assert chart_config['chart']['type'] == 'line'
    assert chart_config['series'][0]['data'] == [320000, 340000, 380000]
    
    print("\n✅ Test passed!")


def test_pie_chart_transformation():
    """Test pie chart transformation"""
    print("\n" + "=" * 80)
    print("TEST 7: Pie Chart Transformation")
    print("=" * 80)
    
    raw_response = json.dumps({
        "insight": "Inventory distribution by status",
        "widget_type": "chart",
        "chart_type": "pie",
        "data": [
            {"status": "Healthy", "percentage": "70"},
            {"status": "Low Stock", "percentage": "20"},
            {"status": "Overstocked", "percentage": "10"}
        ]
    })
    
    print("\nInput (Raw AI Response):")
    print(json.dumps(json.loads(raw_response), indent=2))
    
    result = chat_transformer.transform_response(
        raw_response=raw_response,
        session_id="test-pie-chart",
        context_injected=False
    )
    
    print("\nOutput (Transformed Response):")
    print(json.dumps(result, indent=2))
    
    # Verify
    assert result['widget_type'] == 'chart'
    assert result['chart_type'] == 'pie'
    chart_config = result['data'][0]
    assert chart_config['chart']['type'] == 'pie'
    assert len(chart_config['series'][0]['data']) == 3
    assert chart_config['series'][0]['data'][0]['name'] == 'Healthy'
    assert chart_config['series'][0]['data'][0]['y'] == 70
    
    print("\n✅ Test passed!")


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("CHAT RESPONSE TRANSFORMATION TESTS")
    print("=" * 80)
    
    try:
        test_summary_card_transformation()
        test_grid_transformation()
        test_multiple_summary_cards()
        test_chart_transformation()
        test_error_handling()
        test_line_chart_transformation()
        test_pie_chart_transformation()
        
        print("\n" + "=" * 80)
        print("ALL TESTS PASSED! ✅")
        print("=" * 80)
    except AssertionError as e:
        print(f"\n❌ Test failed: {str(e)}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
